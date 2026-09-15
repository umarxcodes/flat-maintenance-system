// =====================  BLOCKS SERVICE  =========================
import { blocksApi } from "../features/blocks/api/blocks.api.js";

/**
 * Service for managing building blocks and wings.
 */
export const blocksService = {
  getBlocks: (params) => blocksApi.getBlocks(params),
  getBlockById: (id) => blocksApi.getBlockById(id),
  createBlock: (payload) => blocksApi.createBlock(payload),
  updateBlock: (id, payload) => blocksApi.updateBlock(id, payload),
  deleteBlock: (id) => blocksApi.deleteBlock(id),
};

export default blocksService;
