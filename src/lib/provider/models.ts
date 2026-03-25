import {
  DEEPSEEK_BASE_URL,
  DEEPSEEK_DEFAULT_MODEL,
  ZHIPU_BASE_URL,
  QWEN_BASE_URL,
} from "./constants";

/**
 * 模型清单（单一文件）：包含智谱与 DeepSeek 的所有已知 model id。
 * 现有 UI/校验仍可按 provider 拆分使用（例如仅展示智谱 model 下拉）。
 */

export type ModelOption = {
  id: string;
  label: string;
  hint: string;
  /** 给上游请求定位 baseUrl（当前实现仍按 provider 选择 api key） */
  baseUrl: string;
  /** 给上游请求定位 api key */
  apiKey?: string;
};

export type ModelGroup = {
  label: string;
  models: ModelOption[];
};

const ZHIPU_MODEL_GROUPS: ModelGroup[] = [
  {
    label: "速度与轻量",
    models: [
      {
        id: "glm-4-flash",
        label: "GLM-4-Flash",
        hint: "低延迟、适合日常问答与高频调用",
        baseUrl: ZHIPU_BASE_URL,
        apiKey: process.env.ZHIPU_API_KEY,
      },
      {
        id: "glm-4-air",
        label: "GLM-4-Air",
        hint: "均衡速度与质量",
        baseUrl: ZHIPU_BASE_URL,
        apiKey: process.env.ZHIPU_API_KEY,
      },
    ],
  },
  {
    label: "旗舰文本",
    models: [
      {
        id: "glm-4",
        label: "GLM-4",
        hint: "旗舰文本理解与生成",
        baseUrl: ZHIPU_BASE_URL,
        apiKey: process.env.ZHIPU_API_KEY,
      },
      {
        id: "glm-4-plus",
        label: "GLM-4-Plus",
        hint: "加强版推理与长文",
        baseUrl: ZHIPU_BASE_URL,
        apiKey: process.env.ZHIPU_API_KEY,
      },
    ],
  },
  {
    label: "多模态（文本+视觉）",
    models: [
      {
        id: "glm-4v-flash",
        label: "GLM-4V-Flash",
        hint: "多模态轻量版；首版前端仅文本，后端 id 预留",
        baseUrl: ZHIPU_BASE_URL,
        apiKey: process.env.ZHIPU_API_KEY,
      },
      {
        id: "glm-4v-plus",
        label: "GLM-4V-Plus",
        hint: "多模态增强；首版前端仅文本输入",
        baseUrl: ZHIPU_BASE_URL,
        apiKey: process.env.ZHIPU_API_KEY,
      },
    ],
  },
];

const ZHIPU_MODEL_IDS: string[] = ZHIPU_MODEL_GROUPS.flatMap((g) =>
  g.models.map((m) => m.id)
);

const DEEPSEEK_MODEL_GROUPS: ModelGroup[] = [
  {
    label: "DeepSeek",
    models: [
      {
        id: DEEPSEEK_DEFAULT_MODEL,
        label: "DeepSeek Chat",
        hint: "DeepSeek 当前固定使用服务端默认 model id",
        baseUrl: DEEPSEEK_BASE_URL,
        apiKey: process.env.DEEPSEEK_API_KEY,
      },
    ],
  },
];

const DEEPSEEK_MODEL_IDS: string[] = DEEPSEEK_MODEL_GROUPS.flatMap((g) =>
  g.models.map((m) => m.id)
);

/**
 * 合并后的统一模型清单（一个数组）。
 * 系统不再区分智谱/DeepSeek；按 model id 通过上游 baseUrl+apiKey 自动路由。
 */
export const MODEL_GROUPS = [...ZHIPU_MODEL_GROUPS, ...DEEPSEEK_MODEL_GROUPS,
{
  label: "Qwen",
  models: [
    {
      id: "qwen-plus",
      label: "Qwen-Plus",
      hint: "Qwen-Plus",
      baseUrl: QWEN_BASE_URL,
      apiKey: process.env.QWEN_API_KEY,
    },
    {
      id: "qwen-turbo",
      label: "Qwen-Turbo",
      hint: "Qwen-Turbo",
      baseUrl: QWEN_BASE_URL,
      apiKey: process.env.QWEN_API_KEY,
    }
  ],
},
];

export const MODEL_IDS = [...ZHIPU_MODEL_IDS, ...DEEPSEEK_MODEL_IDS];

