// =====================  VISITORS SERVICE  =======================
import { visitorsApi } from "../features/visitors/api/visitors.api.js";

/**
 * Service for visitor registration, digital entry passes, and gate verification.
 */
export const visitorsService = {
  getVisitors: (params) => visitorsApi.getVisitors(params),
  getVisitorById: (id) => visitorsApi.getVisitorById(id),
  createVisitor: (payload) => visitorsApi.createVisitor(payload),
  verifyPassCode: (passCode) => visitorsApi.verifyPassCode(passCode),
  checkInVisitor: (id) => visitorsApi.checkInVisitor(id),
  checkOutVisitor: (id) => visitorsApi.checkOutVisitor(id),
};

export default visitorsService;
