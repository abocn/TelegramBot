import type { ModelInfo } from "../src/commands/ai"

export const defaultFlashModel = "gemma3:4b"
export const defaultThinkingModel = "qwen3:4b"
export const unloadModelAfterB = 0.1 // how many billion params until model is auto-unloaded

export const models: ModelInfo[] = [
  {
    name: 'gemma3n',
    label: 'gemma3n',
    descriptionEn: 'Gemma3n is a family of open, light on-device models for general tasks.',
    descriptionPt: 'Gemma3n é uma família de modelos abertos, leves e para dispositivos locais, para tarefas gerais.',
    models: [
      { name: 'gemma3n:e2b', label: 'Gemma3n e2b', parameterSize: '2B' },
      { name: 'gemma3n:e4b', label: 'Gemma3n e4b', parameterSize: '4B' },
    ]
  },
  {
    name: 'gemma3',
    label: 'gemma3   [ & Uncensored ]',
    descriptionEn: 'Gemma3-abliterated is a family of open, uncensored models for general tasks.',
    descriptionPt: 'Gemma3-abliterated é uma família de modelos abertos, não censurados, para tarefas gerais.',
    models: [
      { name: 'huihui_ai/gemma3-abliterated:1b', label: 'Gemma3 Uncensored 1B', parameterSize: '1B' },
      { name: 'huihui_ai/gemma3-abliterated:4b', label: 'Gemma3 Uncensored 4B', parameterSize: '4B' },
      { name: 'gemma3:1b', label: 'Gemma3 1B', parameterSize: '1B' },
      { name: 'gemma3:4b', label: 'Gemma3 4B', parameterSize: '4B' },
      { name: 'gemma3:12b', label: 'Gemma3 12B', parameterSize: '12B' },
    ]
  },
  {
    name: 'qwen3',
    label: 'Qwen3',
    descriptionEn: 'Qwen3 is a multilingual reasoning model series.',
    descriptionPt: 'Qwen3 é uma série de modelos multilingues.',
    models: [
      { name: 'qwen3:0.6b', label: 'Qwen3 0.6B', parameterSize: '0.6B' },
      { name: 'qwen3:4b', label: 'Qwen3 4B', parameterSize: '4B' },
      { name: 'qwen3:8b', label: 'Qwen3 8B', parameterSize: '8B' },
      { name: 'qwen3:14b', label: 'Qwen3 14B', parameterSize: '14B' },
      { name: 'qwen3:30b', label: 'Qwen3 30B', parameterSize: '30B' },
      { name: 'qwen3:235b-a22b', label: 'Qwen3 235B A22B', parameterSize: '235B' },
    ]
  },
  {
    name: 'qwq',
    label: 'QwQ',
    descriptionEn: 'QwQ is the reasoning model of the Qwen series.',
    descriptionPt: 'QwQ é o modelo de raciocínio da série Qwen.',
    models: [
      { name: 'qwq:32b', label: 'QwQ 32B', parameterSize: '32B' },
    ]
  },
  {
    name: 'llama4',
    label: 'Llama4',
    descriptionEn: 'The latest collection of multimodal models from Meta.',
    descriptionPt: 'A coleção mais recente de modelos multimodais da Meta.',
    models: [
      { name: 'llama4:scout', label: 'Llama4 109B A17B', parameterSize: '109B' },
    ]
  },
  {
    name: 'mistral',
    label: 'Mistral',
    descriptionEn: 'The 7B model released by Mistral AI, updated to version 0.3.',
    descriptionPt: 'O modelo 7B lançado pela Mistral AI, atualizado para a versão 0.3.',
    models: [
      { name: 'mistral:7b', label: 'Mistral 7B', parameterSize: '7B' },
    ]
  },
  {
    name: 'deepseek',
    label: 'DeepSeek   [ & Uncensored ]',
    descriptionEn: 'DeepSeek is a research model for reasoning tasks.',
    descriptionPt: 'DeepSeek é um modelo de pesquisa para tarefas de raciocínio.',
    models: [
      { name: 'deepseek-r1:1.5b', label: 'DeepSeek 1.5B', parameterSize: '1.5B' },
      { name: 'deepseek-r1:7b', label: 'DeepSeek 7B', parameterSize: '7B' },
      { name: 'huihui_ai/deepseek-r1-abliterated:1.5b', label: 'DeepSeek Uncensored 1.5B', parameterSize: '1.5B' },
      { name: 'huihui_ai/deepseek-r1-abliterated:7b', label: 'DeepSeek Uncensored 7B', parameterSize: '7B' },
    ]
  },
  {
    name: 'phi3',
    label: 'Phi3',
    descriptionEn: 'Phi-3 is a family of lightweight 3B (Mini) and 14B (Medium) state-of-the-art open models by Microsoft.',
    descriptionPt: 'Phi-3 é uma família de modelos leves de 3B (Mini) e 14B (Médio) de última geração, abertos pela Microsoft.',
    models: [
      { name: 'phi3:3.8b', label: 'Phi3 3.8B', parameterSize: '3.8B' },
    ]
  }
];