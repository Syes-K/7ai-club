/**
 * 智谱模型下拉：分组内选项 id + 展示文案（含版本特点说明）
 * 与 PRD §2.1 / §4 一致，可按厂商文档调整 model id。
 */
export type ZhipuModelOption = {
  id: string;
  label: string;
  hint: string;
};

export type ZhipuModelGroup = {
  label: string;
  models: ZhipuModelOption[];
};

export const ZHIPU_MODEL_GROUPS: ZhipuModelGroup[] = [
  {
    label: "速度与轻量",
    models: [
      {
        id: "glm-4-flash",
        label: "GLM-4-Flash",
        hint: "低延迟、适合日常问答与高频调用",
      },
      {
        id: "glm-4-air",
        label: "GLM-4-Air",
        hint: "均衡速度与质量",
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
      },
      {
        id: "glm-4-plus",
        label: "GLM-4-Plus",
        hint: "加强版推理与长文",
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
      },
      {
        id: "glm-4v-plus",
        label: "GLM-4V-Plus",
        hint: "多模态增强；首版前端仅文本输入",
      },
    ],
  },
];

/** 扁平 id 列表，用于服务端校验 */
export const ZHIPU_MODEL_IDS: string[] = ZHIPU_MODEL_GROUPS.flatMap((g) =>
  g.models.map((m) => m.id)
);
