export interface ModelInfo {
  name: string;
  label: string;
  descriptionEn: string;
  descriptionPt: string;
  models: Array<{
    name: string;
    label: string;
    parameterSize: string;
    thinking: boolean;
    uncensored: boolean;
  }>;
}

export const defaultFlashModel = "gemma3:4b"
export const defaultThinkingModel = "qwen3:4b"
export const unloadModelAfterB = 12 // how many billion params until model is auto-unloaded
export const maxUserQueueSize = 3

export const models: ModelInfo[] = [
  {
    name: 'gemma3n',
    label: 'gemma3n',
    descriptionEn: 'Gemma3n is a family of open, light on-device models for general tasks.',
    descriptionPt: 'Gemma3n é uma família de modelos abertos, leves e para dispositivos locais, para tarefas gerais.',
    models: [
      {
        name: 'gemma3n:e2b',
        label: 'Gemma3n e2b',
        parameterSize: '2B',
        thinking: false,
        uncensored: false
      },
      {
        name: 'gemma3n:e4b',
        label: 'Gemma3n e4b',
        parameterSize: '4B',
        thinking: false,
        uncensored: false
      },
    ]
  },
  {
    name: 'gemma3',
    label: 'gemma3   [ & Uncensored ]',
    descriptionEn: 'Gemma3-abliterated is a family of open, uncensored models for general tasks.',
    descriptionPt: 'Gemma3-abliterated é uma família de modelos abertos, não censurados, para tarefas gerais.',
    models: [
      {
        name: 'huihui_ai/gemma3-abliterated:1b',
        label: 'Gemma3 Uncensored 1B',
        parameterSize: '1B',
        thinking: false,
        uncensored: true
      },
      {
        name: 'huihui_ai/gemma3-abliterated:4b',
        label: 'Gemma3 Uncensored 4B',
        parameterSize: '4B',
        thinking: false,
        uncensored: true
      },
      {
        name: 'gemma3:1b',
        label: 'Gemma3 1B',
        parameterSize: '1B',
        thinking: false,
        uncensored: false
      },
      {
        name: 'gemma3:4b',
        label: 'Gemma3 4B',
        parameterSize: '4B',
        thinking: false,
        uncensored: false
      },
    ]
  },
  {
    name: 'qwen3',
    label: 'Qwen3',
    descriptionEn: 'Qwen3 is a multilingual reasoning model series.',
    descriptionPt: 'Qwen3 é uma série de modelos multilingues.',
    models: [
      {
        name: 'qwen3:0.6b',
        label: 'Qwen3 0.6B',
        parameterSize: '0.6B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'qwen3:1.7b',
        label: 'Qwen3 1.7B',
        parameterSize: '1.7B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'qwen3:4b',
        label: 'Qwen3 4B',
        parameterSize: '4B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'qwen3:8b',
        label: 'Qwen3 8B',
        parameterSize: '8B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'qwen3:14b',
        label: 'Qwen3 14B',
        parameterSize: '14B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'qwen3:30b',
        label: 'Qwen3 30B',
        parameterSize: '30B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'qwen3:32b',
        label: 'Qwen3 32B',
        parameterSize: '32B',
        thinking: true,
        uncensored: false
      },
    ]
  },
  {
    name: 'qwen3-abliterated',
    label: 'Qwen3   [ Uncensored ]',
    descriptionEn: 'Qwen3-abliterated is a multilingual reasoning model series.',
    descriptionPt: 'Qwen3-abliterated é uma série de modelos multilingues.',
    models: [
      {
        name: 'huihui_ai/qwen3-abliterated:0.6b',
        label: 'Qwen3 Uncensored 0.6B',
        parameterSize: '0.6B',
        thinking: true,
        uncensored: true
      },
      {
        name: 'huihui_ai/qwen3-abliterated:1.7b',
        label: 'Qwen3 Uncensored 1.7B',
        parameterSize: '1.7B',
        thinking: true,
        uncensored: true
      },
      {
        name: 'huihui_ai/qwen3-abliterated:4b',
        label: 'Qwen3 Uncensored 4B',
        parameterSize: '4B',
        thinking: true,
        uncensored: true
      },
      {
        name: 'huihui_ai/qwen3-abliterated:8b',
        label: 'Qwen3 Uncensored 8B',
        parameterSize: '8B',
        thinking: true,
        uncensored: true
      },
      {
        name: 'huihui_ai/qwen3-abliterated:14b',
        label: 'Qwen3 Uncensored 14B',
        parameterSize: '14B',
        thinking: true,
        uncensored: true
      },
      {
        name: 'huihui_ai/qwen3-abliterated:30b',
        label: 'Qwen3 Uncensored 30B',
        parameterSize: '30B',
        thinking: true,
        uncensored: true
      },
      {
        name: 'huihui_ai/qwen3-abliterated:32b',
        label: 'Qwen3 Uncensored 32B',
        parameterSize: '32B',
        thinking: true,
        uncensored: true
      },
    ]
  },
  {
    name: 'qwq',
    label: 'QwQ',
    descriptionEn: 'QwQ is the reasoning model of the Qwen series.',
    descriptionPt: 'QwQ é o modelo de raciocínio da série Qwen.',
    models: [
      {
        name: 'qwq:32b',
        label: 'QwQ 32B',
        parameterSize: '32B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'huihui_ai/qwq-abliterated:32b',
        label: 'QwQ Uncensored 32B',
        parameterSize: '32B',
        thinking: true,
        uncensored: true
      },
    ]
  },
  {
    name: 'llama4',
    label: 'Llama4',
    descriptionEn: 'The latest collection of multimodal models from Meta.',
    descriptionPt: 'A coleção mais recente de modelos multimodais da Meta.',
    models: [
      {
        name: 'llama4:scout',
        label: 'Llama4 109B A17B',
        parameterSize: '109B',
        thinking: false,
        uncensored: false
      },
    ]
  },
  {
    name: 'deepseek',
    label: 'DeepSeek   [ & Uncensored ]',
    descriptionEn: 'DeepSeek is a research model for reasoning tasks.',
    descriptionPt: 'DeepSeek é um modelo de pesquisa para tarefas de raciocínio.',
    models: [
      {
        name: 'deepseek-r1:1.5b',
        label: 'DeepSeek 1.5B',
        parameterSize: '1.5B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'deepseek-r1:7b',
        label: 'DeepSeek 7B',
        parameterSize: '7B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'deepseek-r1:8b',
        label: 'DeepSeek 8B',
        parameterSize: '8B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'huihui_ai/deepseek-r1-abliterated:1.5b',
        label: 'DeepSeek Uncensored 1.5B',
        parameterSize: '1.5B',
        thinking: true,
        uncensored: true
      },
      {
        name: 'huihui_ai/deepseek-r1-abliterated:7b',
        label: 'DeepSeek Uncensored 7B',
        parameterSize: '7B',
        thinking: true,
        uncensored: true
      },
      {
        name: 'huihui_ai/deepseek-r1-abliterated:8b',
        label: 'DeepSeek Uncensored 8B',
        parameterSize: '8B',
        thinking: true,
        uncensored: true
      },
      {
        name: 'huihui_ai/deepseek-r1-abliterated:14b',
        label: 'DeepSeek Uncensored 14B',
        parameterSize: '14B',
        thinking: true,
        uncensored: true
      },
    ]
  },
  {
    name: 'hermes3',
    label: 'Hermes3',
    descriptionEn: 'Hermes 3 is the latest version of the flagship Hermes series of LLMs by Nous Research.',
    descriptionPt: 'Hermes 3 é a versão mais recente da série Hermes de LLMs da Nous Research.',
    models: [
      {
        name: 'hermes3:3b',
        label: 'Hermes3 3B',
        parameterSize: '3B',
        thinking: false,
        uncensored: false
      },
      {
        name: 'hermes3:8b',
        label: 'Hermes3 8B',
        parameterSize: '8B',
        thinking: false,
        uncensored: false
      },
    ]
  },
  {
    name: 'mistral',
    label: 'Mistral',
    descriptionEn: 'The 7B model released by Mistral AI, updated to version 0.3.',
    descriptionPt: 'O modelo 7B lançado pela Mistral AI, atualizado para a versão 0.3.',
    models: [
      {
        name: 'mistral:7b',
        label: 'Mistral 7B',
        parameterSize: '7B',
        thinking: false,
        uncensored: false
      },
    ]
  },
  {
    name: 'phi4   [ & Uncensored ]',
    label: 'Phi4',
    descriptionEn: 'Phi-4 is a 14B parameter, state-of-the-art open model from Microsoft. ',
    descriptionPt: 'Phi-4 é um modelo de 14B de última geração, aberto pela Microsoft.',
    models: [
      {
        name: 'hf.co/unsloth/Phi-4-mini-reasoning-GGUF',
        label: 'Phi4 Mini Reasoning',
        parameterSize: '4B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'phi4:14b',
        label: 'Phi4 14B',
        parameterSize: '14B',
        thinking: false,
        uncensored: false
      },
      {
        name: 'hf.co/unsloth/Phi-4-reasoning-plus-GGUF',
        label: 'Phi4 Reasoning Plus',
        parameterSize: '14B',
        thinking: true,
        uncensored: false
      },
      {
        name: 'huihui_ai/phi4-abliterated:14b',
        label: 'Phi4 Uncensored 14B',
        parameterSize: '14B',
        thinking: false,
        uncensored: true
      },
    ]
  },
  {
    name: 'phi3',
    label: 'Phi3',
    descriptionEn: 'Phi-3 is a family of lightweight 3B (Mini) and 14B (Medium) state-of-the-art open models by Microsoft.',
    descriptionPt: 'Phi-3 é uma família de modelos leves de 3B (Mini) e 14B (Médio) de última geração, abertos pela Microsoft.',
    models: [
      {
        name: 'phi3:3.8b',
        label: 'Phi3 3.8B',
        parameterSize: '3.8B',
        thinking: false,
        uncensored: false
      },
    ]
  },
  {
    name: 'llama3',
    label: 'Llama4',
    descriptionEn: 'Llama 3, a lightweight model from Meta.',
    descriptionPt: 'Llama 3, um modelo leve da Meta.',
    models: [
      {
        name: 'llama3:8b',
        label: 'Llama3 8B',
        parameterSize: '8B',
        thinking: false,
        uncensored: false
      },
    ]
  },
  {
    name: 'llama3.1   [ Uncensored ]',
    label: 'Llama3.1',
    descriptionEn: 'Ablitered v3 llama-3.1 8b with uncensored prompt ',
    descriptionPt: 'Llama3.1 é um modelo aberto, leve e para dispositivos locais, com prompt não censurado.',
    models: [
      {
        name: 'mannix/llama3.1-8b-abliterated:latest',
        label: 'Llama3.1 8B',
        parameterSize: '8B',
        thinking: false,
        uncensored: true
      },
    ]
  },
  {
    name: 'llama3.2   [ & Uncensored ]',
    label: 'Llama3.2',
    descriptionEn: 'Llama3.2 is a family of open, lightweight models for general tasks.',
    descriptionPt: 'Llama3.2 é uma família de modelos abertos, leves e para dispositivos locais, para tarefas gerais.',
    models: [
      {
        name: 'llama3.2:1b',
        label: 'Llama3.2 1B',
        parameterSize: '1B',
        thinking: false,
        uncensored: false
      },
      {
        name: 'llama3.2:3b',
        label: 'Llama3.2 3B',
        parameterSize: '3B',
        thinking: false,
        uncensored: false
      },
      {
        name: 'socialnetwooky/llama3.2-abliterated:3b_q8_0',
        label: 'Llama3.2 Uncensored 3B',
        parameterSize: '3B',
        thinking: false,
        uncensored: true
      },
    ]
  },
];