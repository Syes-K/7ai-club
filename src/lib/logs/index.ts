export * from "./chat-log-types";
export { FIELD_LABEL_ZH, fieldLabelZh } from "./log-field-labels";
export {
  createChatLogFileRepository,
} from "./chat-log-file-repository";
import { createChatLogFileRepository } from "./chat-log-file-repository";

/** 默认文件型实现；后续可换为 DB 实现并在此处切换 */
export const chatLogRepository = createChatLogFileRepository();
