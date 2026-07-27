import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limits for PDF / Image base64 ingestion (up to 100MB for large documents)
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Initialize Gemini Client server-side
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não foi configurada nos Segredos/Variáveis de ambiente.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health Check API
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Deep Explanation Request (with Google Search grounding)
app.post("/api/ai/explain-question", async (req, res) => {
  try {
    const { stem, options, selectedOption, correctAnswer, currentExplanation } = req.body;
    const ai = getGeminiClient();

    const prompt = `Você é um professor universitário e doutor especialista na área.
Forneça uma análise aprofundada e atualizada com referências bibliográficas e legislação recente para a seguinte questão:

ENUNCIADO:
${stem}

ALTERNATIVAS:
${JSON.stringify(options, null, 2)}

RESPOSTA CORRETA: ${correctAnswer}
AÇÃO DO ALUNO: Escolheu a alternativa "${selectedOption}"

Forneça:
1. Análise teórica detalhada com jurisprudência, diretriz técnica ou doutrina aplicável.
2. Análise minuciosa de cada alternativa.
3. Fontes de referência verificáveis com pesquisa.
4. Um conselho de memorização (macete/mnemônico) para o aluno nunca mais errar este tópico.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const searchChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const webSources = searchChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Fonte Web",
        url: chunk.web.uri,
      }));

    return res.json({
      success: true,
      explanation: response.text,
      webSources,
    });
  } catch (error: any) {
    console.error("Erro ao gerar explicação aprofundada:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Falha ao gerar explicação avançada.",
    });
  }
});

// Parse and Structure Raw Questions text with Gemini AI
app.post("/api/ai/parse-questions", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: "Por favor, forneça o texto das questões para estruturação.",
      });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Você é um motor especializado de estruturação de provas e questões de concursos, exames e faculdade.

O usuário colará um texto extenso, por vezes contendo várias questões completas com textos de apoio longos, tabelas descritas em texto, citações e alternativas.

SUAS TAREFAS CRÍTICAS:
1. Identifique e separe CADA questão individual do texto.
2. Para cada questão, mantenha O ENUNCIADO COMPLETO, incluindo textos de apoio, contexto, comandos e tabelas. NUNCA resuma ou corte o enunciado.
3. Mantenha TODAS as alternativas de cada questão (A, B, C, D, E) com seus textos originais íntegros.
4. Identifique "tag" (banca, ano, disciplina ou tema se houver no texto, senão "") e "dificuldade" ("Fácil", "Médio" ou "Difícil").
5. Realize uma AUTOREVISÃO ao final: se identificar que algum trecho relevante do texto original não foi atribuído a nenhuma questão ou se uma alternativa parece incompleta, preencha "reviewNote" alertando o usuário.

FORMATO DE SAÍDA (JSON estrito):
{
  "questoes": [
    {
      "tag": "string",
      "dificuldade": "Fácil" | "Médio" | "Difícil",
      "enunciado": "string",
      "alternativas": [{ "letra": "A", "texto": "string" }],
      "reviewNote": "string"
    }
  ],
  "reviewNotes": "string"
}`;

    const prompt = `TEXTO BRUTO PARA ESTRUTURAÇÃO:\n"""\n${text}\n"""`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questoes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tag: { type: Type.STRING },
                  dificuldade: { type: Type.STRING },
                  enunciado: { type: Type.STRING },
                  alternativas: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        letra: { type: Type.STRING },
                        texto: { type: Type.STRING },
                      },
                      required: ["letra", "texto"],
                    },
                  },
                  reviewNote: { type: Type.STRING },
                },
                required: ["enunciado", "alternativas"],
              },
            },
            reviewNotes: { type: Type.STRING },
          },
          required: ["questoes"],
        },
      },
    });

    const jsonText = response.text || "{}";
    let parsedData: any;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseErr) {
      return res.status(422).json({
        success: false,
        error: "A IA retornou um formato inválido ao estruturar o texto. Tente novamente ou ajuste o texto original.",
        rawText: jsonText,
      });
    }

    if (!parsedData.questoes || !Array.isArray(parsedData.questoes) || parsedData.questoes.length === 0) {
      return res.status(422).json({
        success: false,
        error: "Nenhuma questão foi identificada no texto fornecido. Verifique se o texto possui enunciados e alternativas.",
      });
    }

    return res.json({
      success: true,
      questoes: parsedData.questoes,
      reviewNotes: parsedData.reviewNotes || "",
    });
  } catch (error: any) {
    console.error("Erro ao estruturar questões com IA:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro no servidor ao processar e estruturar as questões com IA.",
    });
  }
});

// Format Raw Explanation Text into Clean Pedagogical Markdown
app.post("/api/ai/format-explanation", async (req, res) => {
  try {
    const { explanation } = req.body;
    if (!explanation || !explanation.trim()) {
      return res.status(400).json({
        success: false,
        error: "Nenhum texto de explicação foi fornecido.",
      });
    }

    const ai = getGeminiClient();

    const prompt = `Você é um editor pedagógico especializado.
Reorganize o texto de explicação abaixo em um formato de Markdown claro, bonito e didático para estudantes:

REGRAS RÍGIDAS:
1. Mantenha 100% do conteúdo conceitual original. Não adicione opiniões nem informações novas inventadas.
2. Organize em parágrafos curtos, tópicos com marcadores (bullet points) e destaques em **negrito** nos termos-chave e conceitos essenciais.
3. Se houver análise de alternativas no texto original, organize cada alternativa em seu próprio tópico.
4. Retorne apenas o texto formatado em Markdown limpo em Português.

TEXTO ORIGINAL:
"""
${explanation}
"""`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return res.json({
      success: true,
      formattedExplanation: response.text || explanation,
    });
  } catch (error: any) {
    console.error("Erro ao formatar explicação com IA:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro ao organizar texto de explicação.",
    });
  }
});

// Generate Mind Map from Explanation Text
app.post("/api/ai/generate-mindmap", async (req, res) => {
  try {
    const { explanation, stem } = req.body;
    if (!explanation || explanation.trim().length < 15) {
      return res.json({
        success: true,
        hasMindMap: false,
        reason: "Explicação muito curta para mapa mental.",
      });
    }

    const ai = getGeminiClient();

    const prompt = `Você é um especialista em síntese visual do conhecimento e criação de mapas mentais pedagógicos.

A partir do enunciado da questão e do texto explicativo abaixo, crie um mapa mental hierárquico simplificado para o estudante memorizar o assunto.

ENUNCIADO:
${stem || ""}

EXPLICAÇÃO:
${explanation}

REGRAS:
- Se a explicação for genérica demais, vazia ou insuficiente para extrair pelo menos 2 ramificações úteis, defina "hasMindMap": false.
- Caso contrário, extraia o tema central ("centralTopic") e crie a árvore com "root":
  - "label": texto curto e direto (máx 5-7 palavras por nó).
  - "color": escolha entre "indigo", "emerald", "amber", "rose", "sky", "purple".
  - "children": array de nós filhos com conceitos-chave e detalhes.

FORMATO DE SAÍDA (JSON estrito):
{
  "hasMindMap": true,
  "mindMap": {
    "centralTopic": "Tema Central Ex: Inviolabilidade Domiciliar",
    "root": {
      "id": "node-root",
      "label": "Regra Geral: Casa Inviolável",
      "color": "indigo",
      "children": [
        {
          "id": "node-1",
          "label": "De Dia ou De Noite",
          "color": "emerald",
          "children": [
            { "id": "node-1-1", "label": "Flagrante delito", "children": [] },
            { "id": "node-1-2", "label": "Desastre ou socorro", "children": [] }
          ]
        },
        {
          "id": "node-2",
          "label": "Apenas De Dia",
          "color": "amber",
          "children": [
            { "id": "node-2-1", "label": "Determinação judicial", "children": [] }
          ]
        }
      ]
    }
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hasMindMap: { type: Type.BOOLEAN },
            mindMap: {
              type: Type.OBJECT,
              properties: {
                centralTopic: { type: Type.STRING },
                root: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    label: { type: Type.STRING },
                    color: { type: Type.STRING },
                    children: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          id: { type: Type.STRING },
                          label: { type: Type.STRING },
                          color: { type: Type.STRING },
                          children: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                id: { type: Type.STRING },
                                label: { type: Type.STRING },
                                color: { type: Type.STRING },
                              },
                              required: ["id", "label"],
                            },
                          },
                        },
                        required: ["id", "label"],
                      },
                    },
                  },
                  required: ["id", "label"],
                },
              },
              required: ["centralTopic", "root"],
            },
          },
          required: ["hasMindMap"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({
      success: true,
      hasMindMap: !!parsedData.hasMindMap,
      mindMap: parsedData.mindMap || null,
    });
  } catch (error: any) {
    console.error("Erro ao gerar mapa mental:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Erro ao gerar mapa mental.",
    });
  }
});

// Generate Custom Practice Questions Endpoint
app.post("/api/ai/generate-questions", async (req, res) => {
  try {
    const { topic, amount = 5, difficulty = "Médio", targetExam = "Geral" } = req.body;

    const ai = getGeminiClient();

    const prompt = `Gere exatamente ${amount} questões inéditas de concurso/faculdade sobre o tema: "${topic}".
Nível de dificuldade: ${difficulty}.
Estilo de prova / Foco: ${targetExam}.

Siga a estrutura JSON estrita exigida. O gabarito deve ser 100% correto, com explicações pedagógicas ricas em Português.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedTitle: { type: Type.STRING },
            suggestedCategory: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stem: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        text: { type: Type.STRING },
                      },
                      required: ["label", "text"],
                    },
                  },
                  correctAnswer: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  breakdown: {
                    type: Type.OBJECT,
                    properties: {
                      whyCorrect: { type: Type.STRING },
                      whyOthersIncorrect: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            option: { type: Type.STRING },
                            reason: { type: Type.STRING },
                          },
                          required: ["option", "reason"],
                        },
                      },
                      keyConcept: { type: Type.STRING },
                    },
                    required: ["whyCorrect", "whyOthersIncorrect", "keyConcept"],
                  },
                  sources: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        authorOrLaw: { type: Type.STRING },
                      },
                      required: ["title"],
                    },
                  },
                  difficulty: { type: Type.STRING },
                  tags: { type: Type.ARRAY, items: { type: Type.STRING } },
                },
                required: ["stem", "options", "correctAnswer", "explanation", "breakdown"],
              },
            },
          },
          required: ["suggestedTitle", "suggestedCategory", "questions"],
        },
      },
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error("Erro ao gerar questões por tema:", error);
    return res.status(500).json({ success: false, error: error.message || "Erro ao gerar questões." });
  }
});

// Start Express + Vite Server
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyForge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
