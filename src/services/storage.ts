import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { collection, doc, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { auth, db as firestoreDb } from './firebase';
import { Module, Question, UserAnswer, Folder, UserProfile, QuestionFlag } from '../types';

interface StudyForgeDB extends DBSchema {
  modules: {
    key: string;
    value: Module;
    indexes: { 'by-category': string; 'by-folder': string };
  };
  questions: {
    key: string;
    value: Question;
    indexes: { 'by-module': string };
  };
  user_answers: {
    key: string;
    value: UserAnswer;
    indexes: { 'by-question': string; 'by-module': string };
  };
  folders: {
    key: string;
    value: Folder;
  };
  flags: {
    key: string;
    value: QuestionFlag;
  };
  user_profile: {
    key: string;
    value: UserProfile;
  };
}

const DB_NAME = 'StudyForgeDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<StudyForgeDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<StudyForgeDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Modules Store
        if (!db.objectStoreNames.contains('modules')) {
          const moduleStore = db.createObjectStore('modules', { keyPath: 'id' });
          moduleStore.createIndex('by-category', 'category');
          moduleStore.createIndex('by-folder', 'folderId');
        }

        // Questions Store
        if (!db.objectStoreNames.contains('questions')) {
          const questionStore = db.createObjectStore('questions', { keyPath: 'id' });
          questionStore.createIndex('by-module', 'moduleId');
        }

        // User Answers Store
        if (!db.objectStoreNames.contains('user_answers')) {
          const answerStore = db.createObjectStore('user_answers', { keyPath: 'id' });
          answerStore.createIndex('by-question', 'questionId');
          answerStore.createIndex('by-module', 'moduleId');
        }

        // Folders Store
        if (!db.objectStoreNames.contains('folders')) {
          db.createObjectStore('folders', { keyPath: 'id' });
        }

        // Flags Store
        if (!db.objectStoreNames.contains('flags')) {
          db.createObjectStore('flags', { keyPath: 'questionId' });
        }

        // Profile Store
        if (!db.objectStoreNames.contains('user_profile')) {
          db.createObjectStore('user_profile', { keyPath: 'email' });
        }
      },
    });
  }
  return dbPromise;
}

function cleanForFirestore<T>(data: T): any {
  if (!data) return data;
  return JSON.parse(JSON.stringify(data));
}

// Migrate or Sync Local IndexedDB Data with User's Firestore Account
export async function syncUserDataToFirestoreIfNew(uid: string): Promise<void> {
  try {
    const localDb = await getDB();
    const userModulesRef = collection(firestoreDb, 'users', uid, 'modules');
    const firestoreSnapshot = await getDocs(userModulesRef);

    if (firestoreSnapshot.empty) {
      // First login for this account: migrate all existing local data to Firestore!
      await seedInitialDataIfNeeded();
      const localModules = await localDb.getAll('modules');
      const localQuestions = await localDb.getAll('questions');
      const localAnswers = await localDb.getAll('user_answers');
      const localFolders = await localDb.getAll('folders');
      const localFlags = await localDb.getAll('flags');

      for (const mod of localModules) {
        await setDoc(doc(firestoreDb, 'users', uid, 'modules', mod.id), cleanForFirestore(mod));
      }
      for (const q of localQuestions) {
        await setDoc(doc(firestoreDb, 'users', uid, 'questions', q.id), cleanForFirestore(q));
      }
      for (const a of localAnswers) {
        await setDoc(doc(firestoreDb, 'users', uid, 'user_answers', a.id), cleanForFirestore(a));
      }
      for (const f of localFolders) {
        await setDoc(doc(firestoreDb, 'users', uid, 'folders', f.id), cleanForFirestore(f));
      }
      for (const flag of localFlags) {
        await setDoc(doc(firestoreDb, 'users', uid, 'flags', flag.questionId), cleanForFirestore(flag));
      }
    } else {
      // Existing Firestore user logging in on a new device/session: sync down from Firestore to IndexedDB
      const modules: Module[] = [];
      firestoreSnapshot.forEach((d) => modules.push(d.data() as Module));
      const tx = localDb.transaction(['modules'], 'readwrite');
      for (const m of modules) {
        await tx.objectStore('modules').put(m);
      }
      await tx.done;

      const qSnap = await getDocs(collection(firestoreDb, 'users', uid, 'questions'));
      const questions: Question[] = [];
      qSnap.forEach((d) => questions.push(d.data() as Question));
      const txQ = localDb.transaction(['questions'], 'readwrite');
      for (const q of questions) {
        await txQ.objectStore('questions').put(q);
      }
      await txQ.done;

      const aSnap = await getDocs(collection(firestoreDb, 'users', uid, 'user_answers'));
      const answers: UserAnswer[] = [];
      aSnap.forEach((d) => answers.push(d.data() as UserAnswer));
      const txA = localDb.transaction(['user_answers'], 'readwrite');
      for (const a of answers) {
        await txA.objectStore('user_answers').put(a);
      }
      await txA.done;

      const fSnap = await getDocs(collection(firestoreDb, 'users', uid, 'folders'));
      const folders: Folder[] = [];
      fSnap.forEach((d) => folders.push(d.data() as Folder));
      const txF = localDb.transaction(['folders'], 'readwrite');
      for (const f of folders) {
        await txF.objectStore('folders').put(f);
      }
      await txF.done;

      const flagSnap = await getDocs(collection(firestoreDb, 'users', uid, 'flags'));
      const flags: QuestionFlag[] = [];
      flagSnap.forEach((d) => flags.push(d.data() as QuestionFlag));
      const txFlag = localDb.transaction(['flags'], 'readwrite');
      for (const fl of flags) {
        await txFlag.objectStore('flags').put(fl);
      }
      await txFlag.done;
    }
  } catch (err) {
    console.error('Erro na sincronização Firestore:', err);
  }
}

// Initial Seed Data
const SEED_MODULES: Module[] = [
  {
    id: 'mod-const-1',
    title: 'Direito Constitucional — Direitos e Garantias Fundamentais',
    description: 'Questões de concursos anteriores sobre Art. 5º da CF/88, inviolabilidade de domicílio e remédios constitucionais.',
    category: 'Concursos & OAB',
    questionCount: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    color: 'emerald',
    icon: 'ShieldCheck',
  },
  {
    id: 'mod-med-1',
    title: 'Medicina & Urgência — Suporte Básico de Vida (AHA 2020+)',
    description: 'Cardiopatia, atendimento à parada cardiorrespiratória (PCR) e condutas prioritárias em emergência.',
    category: 'Saúde & Residência',
    questionCount: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    color: 'sky',
    icon: 'HeartPulse',
  },
  {
    id: 'mod-port-1',
    title: 'Língua Portuguesa — Crase, Regência e Concordância',
    description: 'Regras de crase proibida e facultativa, regência verbal e nominal com justificativa gramatical.',
    category: 'Língua Portuguesa',
    questionCount: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    color: 'amber',
    icon: 'BookOpen',
  },
];

const SEED_QUESTIONS: Question[] = [
  {
    id: 'q-const-1',
    moduleId: 'mod-const-1',
    stem: 'Segundo o Art. 5º, XI, da Constituição Federal de 1988, a casa é asilo inviolável do indivíduo, ninguém nela podendo penetrar sem consentimento do morador, salvo:',
    options: [
      { id: 'opt-1', label: 'A', text: 'Em caso de flagrante delito ou desastre, ou para prestar socorro, ou, durante o dia, por determinação judicial.' },
      { id: 'opt-2', label: 'B', text: 'A qualquer hora do dia ou da noite, mediante ordem policial fundamentada por delegado.' },
      { id: 'opt-3', label: 'C', text: 'Somente durante a noite, mediante autorização do Ministério Público.' },
      { id: 'opt-4', label: 'D', text: 'Em caso de desastre ou mandado judicial, a qualquer hora do dia ou da noite.' },
      { id: 'opt-5', label: 'E', text: 'Apenas em caso de consentimento expresso do proprietário, sem exceções legais.' },
    ],
    correctAnswer: 'A',
    explanation: 'Conforme expressamente estipulado no artigo 5º, inciso XI, da CF/88, a regra geral é a inviolabilidade do domicílio. As exceções são divididas pelo fator temporal: durante a noite, só se admite entrada sem consentimento em caso de flagrante delito, desastre ou para prestar socorro. A determinação judicial é uma exceção que SÓ pode ser cumprida durante o dia.',
    breakdown: {
      whyCorrect: 'A alternativa A reflete exatamente a literalidade do Art. 5º, XI da CF/88, especificando que a ordem judicial exige o período diurno.',
      whyOthersIncorrect: [
        { option: 'B', reason: 'Delegado de Polícia não tem poder constitucional para emitir ordem de busca e apreensão domiciliar.' },
        { option: 'C', reason: 'A CF não autoriza buscas noturnas por simples ordem do MP.' },
        { option: 'D', reason: 'A determinação judicial para inviolabilidade domiciliar exige que seja executada no período diurno.' },
        { option: 'E', reason: 'Existem exceções constitucionais expressas mesmo sem o consentimento.' }
      ],
      keyConcept: 'Inviolabilidade de Domicílio: Mandado judicial SÓ de dia. Flagrante, desastre ou socorro: de dia ou de noite.'
    },
    sources: [
      { title: 'Constituição da República Federativa do Brasil de 1988 — Art. 5º, XI', authorOrLaw: 'Senado Federal' },
      { title: 'Direito Constitucional Descomplicado', authorOrLaw: 'Vicente Paulo & Marcelo Alexandrino' }
    ],
    difficulty: 'Fácil',
    tags: ['Direito Constitucional', 'Artigo 5º', 'Garantias Fundamentais'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'q-const-2',
    moduleId: 'mod-const-1',
    stem: 'Qual o remédio constitucional adequado para assegurar o conhecimento de informações relativas à pessoa do impetrante, constantes de bancos de dados de entidades governamentais ou de caráter público?',
    options: [
      { id: 'opt-1', label: 'A', text: 'Mandado de Segurança' },
      { id: 'opt-2', label: 'B', text: 'Habeas Corpus' },
      { id: 'opt-3', label: 'C', text: 'Habeas Data' },
      { id: 'opt-4', label: 'D', text: 'Ação Popular' },
      { id: 'opt-5', label: 'E', text: 'Mandado de Injunção' },
    ],
    correctAnswer: 'C',
    explanation: 'O Habeas Data (Art. 5º, LXXII, CF/88) destina-se expressamente a assegurar o conhecimento de informações relativas à pessoa do impetrante (caráter personalíssimo) ou para a retificação de dados em bancos de entidades governamentais ou de caráter público.',
    breakdown: {
      whyCorrect: 'O Habeas Data tem como objeto específico a proteção do direito de informação pessoal e retificação de dados cadastrais públicos.',
      whyOthersIncorrect: [
        { option: 'A', reason: 'Mandado de Segurança tem caráter residual (para direito líquido e certo não amparado por HC ou HD).' },
        { option: 'B', reason: 'Habeas Corpus protege estritamente o direito de locomoção e ir e vir.' },
        { option: 'D', reason: 'Ação Popular visa anular ato lesivo ao patrimônio público, moralidade ou meio ambiente.' },
        { option: 'E', reason: 'Mandado de Injunção supre omissão legislativa que inviabilize direito constitucional.' }
      ],
      keyConcept: 'Remédios Constitucionais: HD = Informação/Retificação pessoal; HC = Locomoção; MS = Residual líquido e certo.'
    },
    sources: [
      { title: 'Lei nº 9.507/1997 (Rito do Habeas Data)', authorOrLaw: 'Planalto' }
    ],
    difficulty: 'Médio',
    tags: ['Habeas Data', 'Remédios Constitucionais'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'q-med-1',
    moduleId: 'mod-med-1',
    stem: 'Durante o atendimento a um adulto em Parada Cardiorrespiratória (PCR) presenciada em ambiente extra-hospitalar, a relação de compressões torácicas e ventilações recomendada pela American Heart Association (AHA) para um único socorrista é:',
    options: [
      { id: 'opt-1', label: 'A', text: '15 compressões para 2 ventilações.' },
      { id: 'opt-2', label: 'B', text: '30 compressões para 2 ventilações.' },
      { id: 'opt-3', label: 'C', text: '50 compressões para 5 ventilações.' },
      { id: 'opt-4', label: 'D', text: 'Compressões contínuas sem ventilações em qualquer circunstância.' },
      { id: 'opt-5', label: 'E', text: '5 compressões para 1 ventilação.' },
    ],
    correctAnswer: 'B',
    explanation: 'De acordo com as Diretrizes da AHA (American Heart Association) para Suporte Básico de Vida em Adultos, a relação padrão universal de compressão-ventilação com 1 ou 2 socorristas em adultos é de 30:2, garantindo frequência entre 100 e 120 cpm e profundidade de 5 a 6 cm.',
    breakdown: {
      whyCorrect: 'A razão 30:2 otimiza a perfusão coronariana mantendo fração de compressão adequada no adulto.',
      whyOthersIncorrect: [
        { option: 'A', reason: 'A razão 15:2 é utilizada para crianças/lactentes na presença de DOIS socorristas de saúde.' },
        { option: 'C', reason: '50:5 não faz parte dos protocolos reconhecidos internacionalmente.' },
        { option: 'D', reason: 'RCP somente com as mãos (Hands-Only) é recomendada para leigos não treinados, mas a diretriz padrão completa prevê 30:2.' },
        { option: 'E', reason: '5:1 é uma recomendação obsoleta descartada nas diretrizes modernas.' }
      ],
      keyConcept: 'AHA SBV Adulto: 30 compressões : 2 ventilações. Frequência 100-120/min. Profundidade 5 a 6cm.'
    },
    sources: [
      { title: 'AHA 2020 Guidelines for CPR and ECC', authorOrLaw: 'American Heart Association' }
    ],
    difficulty: 'Fácil',
    tags: ['Medicina de Urgência', 'Cardiologia', 'BLS', 'AHA'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'q-port-1',
    moduleId: 'mod-port-1',
    stem: 'Assinale a alternativa em que o uso do sinal indicativo de crase é OBRIGATÓRIO de acordo com a norma-padrão da Língua Portuguesa:',
    options: [
      { id: 'opt-1', label: 'A', text: 'Entregamos o documento a uma secretária da diretoria.' },
      { id: 'opt-2', label: 'B', text: 'O candidato começou a estudar logo após a publicação do edital.' },
      { id: 'opt-3', label: 'C', text: 'O professor fez referência à aluna mais dedicada da turma.' },
      { id: 'opt-4', label: 'D', text: 'Eles foram a pé para o centro da cidade.' },
      { id: 'opt-5', label: 'E', text: 'Dirigiu-se a ela com extrema gentileza.' },
    ],
    correctAnswer: 'C',
    explanation: 'Na frase "O professor fez referência à aluna...", o substantivo "referência" exige a preposição "a" (fazer referência A algo/alguém) e o substantivo feminino "aluna" vem acompanhado do artigo definido feminino "a". A fusão preposição a + artigo a gera a crase obrigatoriamente (à aluna).',
    breakdown: {
      whyCorrect: 'Ocorre junção da preposição pedida por "referência" com o artigo definido de "aluna".',
      whyOthersIncorrect: [
        { option: 'A', reason: 'Antes do artigo indefinido "uma", não ocorre crase.' },
        { option: 'B', reason: 'Antes de verbos ("estudar"), o uso de crase é terminantemente proibido.' },
        { option: 'D', reason: 'Antes de palavra masculina ("pé"), não há artigo feminino, inviabilizando a crase.' },
        { option: 'E', reason: 'Antes de pronomes pessoais ("ela"), não se emprega crase.' }
      ],
      keyConcept: 'Crase Obrigatória = Preposição A + Artigo Feminino A. Regras de proibição: antes de verbo, palavra masculina, pronome pessoal ou artigo indefinido.'
    },
    sources: [
      { title: 'Gramática da Língua Portuguesa', authorOrLaw: 'Celso Cunha & Lindley Cintra' }
    ],
    difficulty: 'Fácil',
    tags: ['Língua Portuguesa', 'Gramática', 'Crase'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize DB and Seed if empty (only runs ONCE on first initialization)
export async function seedInitialDataIfNeeded() {
  if (localStorage.getItem('studyforge_initial_seeded') === 'true') {
    return;
  }
  const db = await getDB();
  const existingModules = await db.getAll('modules');
  const existingProfiles = await db.getAll('user_profile');

  if (existingModules.length === 0 && existingProfiles.length === 0) {
    const tx = db.transaction(['modules', 'questions', 'folders', 'user_profile'], 'readwrite');
    for (const mod of SEED_MODULES) {
      await tx.objectStore('modules').put(mod);
    }
    for (const q of SEED_QUESTIONS) {
      await tx.objectStore('questions').put(q);
    }
    // Initial folder
    await tx.objectStore('folders').put({
      id: 'f-concursos',
      name: 'Concursos & OAB',
      description: 'Disciplinas preparatórias para exames públicos e OAB',
      color: 'emerald',
      createdAt: new Date().toISOString(),
    });

    // Initial User Profile
    await tx.objectStore('user_profile').put({
      name: 'Estudante Focado',
      email: 'estudante@studyforge.app',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      dailyTarget: 20,
      streakDays: 3,
      lastActiveDate: new Date().toISOString().split('T')[0],
      xp: 450,
      level: 2,
    });

    await tx.done;
  }

  localStorage.setItem('studyforge_initial_seeded', 'true');
}

// Module CRUD
export async function getModules(): Promise<Module[]> {
  await seedInitialDataIfNeeded();
  const db = await getDB();

  if (auth.currentUser) {
    try {
      const snap = await getDocs(collection(firestoreDb, 'users', auth.currentUser.uid, 'modules'));
      if (!snap.empty) {
        const modules: Module[] = [];
        snap.forEach((d) => modules.push(d.data() as Module));
        const tx = db.transaction(['modules'], 'readwrite');
        for (const m of modules) {
          await tx.objectStore('modules').put(m);
        }
        await tx.done;
        return modules;
      }
    } catch (err) {
      console.warn('Falha ao obter módulos da nuvem, usando cache local:', err);
    }
  }

  return db.getAll('modules');
}

export async function saveModule(moduleData: Module): Promise<void> {
  const db = await getDB();
  await db.put('modules', moduleData);

  if (auth.currentUser) {
    try {
      await setDoc(doc(firestoreDb, 'users', auth.currentUser.uid, 'modules', moduleData.id), cleanForFirestore(moduleData));
    } catch (err) {
      console.error('Erro ao salvar caderno no Firestore:', err);
    }
  }
}

export async function deleteModule(moduleId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['modules', 'questions', 'user_answers', 'flags'], 'readwrite');

  // Get all linked questions first to clean up flags
  const questions = await tx.objectStore('questions').index('by-module').getAll(moduleId);
  for (const q of questions) {
    await tx.objectStore('flags').delete(q.id);
  }

  // Delete module
  await tx.objectStore('modules').delete(moduleId);

  // Delete linked questions
  for (const q of questions) {
    await tx.objectStore('questions').delete(q.id);
  }

  // Delete linked user answers
  const answers = await tx.objectStore('user_answers').index('by-module').getAll(moduleId);
  for (const a of answers) {
    await tx.objectStore('user_answers').delete(a.id);
  }

  await tx.done;

  if (auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      await deleteDoc(doc(firestoreDb, 'users', uid, 'modules', moduleId));
      for (const q of questions) {
        await deleteDoc(doc(firestoreDb, 'users', uid, 'questions', q.id));
        await deleteDoc(doc(firestoreDb, 'users', uid, 'flags', q.id));
      }
      for (const a of answers) {
        await deleteDoc(doc(firestoreDb, 'users', uid, 'user_answers', a.id));
      }
    } catch (err) {
      console.error('Erro ao excluir caderno no Firestore:', err);
    }
  }
}

// Question CRUD
export async function getQuestionsByModule(moduleId: string): Promise<Question[]> {
  await seedInitialDataIfNeeded();
  const db = await getDB();

  if (auth.currentUser) {
    try {
      const snap = await getDocs(collection(firestoreDb, 'users', auth.currentUser.uid, 'questions'));
      if (!snap.empty) {
        const questions: Question[] = [];
        snap.forEach((d) => {
          const q = d.data() as Question;
          if (q.moduleId === moduleId) {
            questions.push(q);
          }
        });
        const tx = db.transaction(['questions'], 'readwrite');
        for (const q of questions) {
          await tx.objectStore('questions').put(q);
        }
        await tx.done;
        return questions;
      }
    } catch (err) {
      console.warn('Falha ao obter questões da nuvem, usando cache local:', err);
    }
  }

  return db.getAllFromIndex('questions', 'by-module', moduleId);
}

export async function getAllQuestions(): Promise<Question[]> {
  await seedInitialDataIfNeeded();
  const db = await getDB();

  if (auth.currentUser) {
    try {
      const snap = await getDocs(collection(firestoreDb, 'users', auth.currentUser.uid, 'questions'));
      if (!snap.empty) {
        const questions: Question[] = [];
        snap.forEach((d) => questions.push(d.data() as Question));
        const tx = db.transaction(['questions'], 'readwrite');
        for (const q of questions) {
          await tx.objectStore('questions').put(q);
        }
        await tx.done;
        return questions;
      }
    } catch (err) {
      console.warn('Falha ao obter todas questões da nuvem, usando cache local:', err);
    }
  }

  return db.getAll('questions');
}

export async function saveQuestion(question: Question): Promise<void> {
  const db = await getDB();
  await db.put('questions', question);

  // Update question count in module
  const mod = await db.get('modules', question.moduleId);
  if (mod) {
    const allQuestionsInMod = await db.getAllFromIndex('questions', 'by-module', question.moduleId);
    mod.questionCount = allQuestionsInMod.length;
    mod.updatedAt = new Date().toISOString();
    await db.put('modules', mod);

    if (auth.currentUser) {
      try {
        await setDoc(doc(firestoreDb, 'users', auth.currentUser.uid, 'modules', mod.id), cleanForFirestore(mod));
      } catch (e) {
        console.error('Erro ao atualizar contagem no caderno Firestore:', e);
      }
    }
  }

  if (auth.currentUser) {
    try {
      await setDoc(doc(firestoreDb, 'users', auth.currentUser.uid, 'questions', question.id), cleanForFirestore(question));
    } catch (err) {
      console.error('Erro ao salvar questão no Firestore:', err);
    }
  }
}

export async function saveBatchQuestions(moduleId: string, questions: Question[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['questions', 'modules'], 'readwrite');
  for (const q of questions) {
    await tx.objectStore('questions').put(q);
  }
  const mod = await tx.objectStore('modules').get(moduleId);
  if (mod) {
    const allQs = await tx.objectStore('questions').index('by-module').getAll(moduleId);
    mod.questionCount = allQs.length;
    mod.updatedAt = new Date().toISOString();
    await tx.objectStore('modules').put(mod);
  }
  await tx.done;

  if (auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      for (const q of questions) {
        await setDoc(doc(firestoreDb, 'users', uid, 'questions', q.id), cleanForFirestore(q));
      }
      if (mod) {
        await setDoc(doc(firestoreDb, 'users', uid, 'modules', mod.id), cleanForFirestore(mod));
      }
    } catch (err) {
      console.error('Erro ao salvar lote de questões no Firestore:', err);
    }
  }
}

export async function deleteQuestion(questionId: string, moduleId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['questions', 'modules', 'user_answers', 'flags'], 'readwrite');

  // Delete question
  await tx.objectStore('questions').delete(questionId);

  // Delete flags
  await tx.objectStore('flags').delete(questionId);

  // Delete linked user answers
  const answers = await tx.objectStore('user_answers').index('by-question').getAll(questionId);
  for (const a of answers) {
    await tx.objectStore('user_answers').delete(a.id);
  }

  // Update question count in module
  const mod = await tx.objectStore('modules').get(moduleId);
  if (mod) {
    const remaining = await tx.objectStore('questions').index('by-module').getAll(moduleId);
    mod.questionCount = remaining.length;
    mod.updatedAt = new Date().toISOString();
    await tx.objectStore('modules').put(mod);
  }

  await tx.done;

  if (auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      await deleteDoc(doc(firestoreDb, 'users', uid, 'questions', questionId));
      await deleteDoc(doc(firestoreDb, 'users', uid, 'flags', questionId));
      for (const a of answers) {
        await deleteDoc(doc(firestoreDb, 'users', uid, 'user_answers', a.id));
      }
      if (mod) {
        await setDoc(doc(firestoreDb, 'users', uid, 'modules', mod.id), cleanForFirestore(mod));
      }
    } catch (err) {
      console.error('Erro ao excluir questão no Firestore:', err);
    }
  }
}

export async function removeQuestionFromErrorLog(questionId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['user_answers'], 'readwrite');
  const answers = await tx.objectStore('user_answers').index('by-question').getAll(questionId);
  for (const a of answers) {
    if (!a.isCorrect) {
      await tx.objectStore('user_answers').delete(a.id);
    }
  }
  await tx.done;

  if (auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      for (const a of answers) {
        if (!a.isCorrect) {
          await deleteDoc(doc(firestoreDb, 'users', uid, 'user_answers', a.id));
        }
      }
    } catch (err) {
      console.error('Erro ao remover do caderno de erros no Firestore:', err);
    }
  }
}

// User Answer Operations
export async function saveUserAnswer(answer: UserAnswer): Promise<void> {
  const db = await getDB();
  await db.put('user_answers', answer);

  // Update User Profile Streak & XP
  const profiles = await db.getAll('user_profile');
  if (profiles.length > 0) {
    const profile = profiles[0];
    const todayStr = new Date().toISOString().split('T')[0];

    if (profile.lastActiveDate !== todayStr) {
      profile.streakDays = (profile.streakDays || 0) + 1;
      profile.lastActiveDate = todayStr;
    }

    profile.xp = (profile.xp || 0) + (answer.isCorrect ? 20 : 5);
    profile.level = Math.floor(profile.xp / 200) + 1;

    await db.put('user_profile', profile);
  }

  if (auth.currentUser) {
    try {
      await setDoc(doc(firestoreDb, 'users', auth.currentUser.uid, 'user_answers', answer.id), cleanForFirestore(answer));
    } catch (err) {
      console.error('Erro ao salvar resposta no Firestore:', err);
    }
  }
}

export async function getUserAnswers(): Promise<UserAnswer[]> {
  const db = await getDB();
  return db.getAll('user_answers');
}

export async function getAnswersByModule(moduleId: string): Promise<UserAnswer[]> {
  const db = await getDB();
  return db.getAllFromIndex('user_answers', 'by-module', moduleId);
}

// Flag Operations (Questões Marcadas)
export async function toggleFlagQuestion(questionId: string, notes?: string): Promise<boolean> {
  const db = await getDB();
  const existing = await db.get('flags', questionId);
  let isFlagged = false;
  if (existing) {
    await db.delete('flags', questionId);
    isFlagged = false;
  } else {
    const flagObj = {
      questionId,
      flaggedAt: new Date().toISOString(),
      notes,
    };
    await db.put('flags', flagObj);
    isFlagged = true;
  }

  if (auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      if (isFlagged) {
        await setDoc(doc(firestoreDb, 'users', uid, 'flags', questionId), cleanForFirestore({
          questionId,
          flaggedAt: new Date().toISOString(),
          notes,
        }));
      } else {
        await deleteDoc(doc(firestoreDb, 'users', uid, 'flags', questionId));
      }
    } catch (e) {
      console.error('Erro ao sincronizar marcadores no Firestore:', e);
    }
  }

  return isFlagged;
}

export async function getFlaggedQuestions(): Promise<QuestionFlag[]> {
  const db = await getDB();
  return db.getAll('flags');
}

// Folder Operations
export async function getFolders(): Promise<Folder[]> {
  const db = await getDB();
  return db.getAll('folders');
}

export async function saveFolder(folder: Folder): Promise<void> {
  const db = await getDB();
  await db.put('folders', folder);

  if (auth.currentUser) {
    try {
      await setDoc(doc(firestoreDb, 'users', auth.currentUser.uid, 'folders', folder.id), cleanForFirestore(folder));
    } catch (err) {
      console.error('Erro ao salvar pasta no Firestore:', err);
    }
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['folders', 'modules'], 'readwrite');
  await tx.objectStore('folders').delete(folderId);
  const modules = await tx.objectStore('modules').index('by-folder').getAll(folderId);
  for (const m of modules) {
    m.folderId = undefined;
    await tx.objectStore('modules').put(m);
  }
  await tx.done;

  if (auth.currentUser) {
    try {
      const uid = auth.currentUser.uid;
      await deleteDoc(doc(firestoreDb, 'users', uid, 'folders', folderId));
      for (const m of modules) {
        await setDoc(doc(firestoreDb, 'users', uid, 'modules', m.id), cleanForFirestore(m));
      }
    } catch (err) {
      console.error('Erro ao excluir pasta no Firestore:', err);
    }
  }
}

// Profile Operations
export async function getUserProfile(): Promise<UserProfile> {
  await seedInitialDataIfNeeded();
  const db = await getDB();
  const profiles = await db.getAll('user_profile');
  if (profiles.length > 0) return profiles[0];

  const defaultProfile: UserProfile = {
    name: 'Estudante Focado',
    email: 'estudante@studyforge.app',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dailyTarget: 20,
    streakDays: 1,
    lastActiveDate: new Date().toISOString().split('T')[0],
    xp: 100,
    level: 1,
  };
  await db.put('user_profile', defaultProfile);
  return defaultProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('user_profile', profile);

  if (auth.currentUser) {
    try {
      await setDoc(doc(firestoreDb, 'users', auth.currentUser.uid, 'profile', 'user'), cleanForFirestore(profile));
    } catch (err) {
      console.error('Erro ao salvar perfil no Firestore:', err);
    }
  }
}

// Import & Export Backup
export async function exportDataJSON(): Promise<string> {
  const db = await getDB();
  const modules = await db.getAll('modules');
  const questions = await db.getAll('questions');
  const user_answers = await db.getAll('user_answers');
  const folders = await db.getAll('folders');

  const dump = {
    app: 'StudyForge',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: {
      modules,
      questions,
      user_answers,
      folders,
    },
  };

  return JSON.stringify(dump, null, 2);
}

export async function importDataJSON(jsonString: string): Promise<boolean> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.data || !Array.isArray(parsed.data.modules)) {
      throw new Error('Formato de arquivo de backup inválido.');
    }

    const db = await getDB();
    const tx = db.transaction(['modules', 'questions', 'folders', 'user_answers'], 'readwrite');

    for (const mod of parsed.data.modules) {
      await tx.objectStore('modules').put(mod);
    }
    if (Array.isArray(parsed.data.questions)) {
      for (const q of parsed.data.questions) {
        await tx.objectStore('questions').put(q);
      }
    }
    if (Array.isArray(parsed.data.folders)) {
      for (const f of parsed.data.folders) {
        await tx.objectStore('folders').put(f);
      }
    }
    await tx.done;
    return true;
  } catch (err) {
    console.error('Erro ao importar backup:', err);
    return false;
  }
}
