import { request } from './httpClient';

const id = encodeURIComponent;
const query = (filters = {}) => {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
};

export const getSupportComplaints = (filters) => request(`/support/complaints${query(filters)}`);
export const getUnassignedComplaints = () => request('/support/complaints/unassigned');
export const getSupportComplaint = (complaintId) =>
  request(`/support/complaints/${id(complaintId)}`);
export const claimSupportComplaint = (complaintId) =>
  request(`/support/complaints/${id(complaintId)}/claim`, { method: 'POST' });
export const getComplaintAssignmentHistory = (complaintId) =>
  request(`/support/complaints/${id(complaintId)}/assignment-history`);
export const getComplaintOrderReference = (complaintId) =>
  request(`/support/complaints/${id(complaintId)}/order-reference`);
export const addComplaintProcessing = (complaintId, body) =>
  request(`/support/complaints/${id(complaintId)}/processings`, { method: 'POST', body });
export const updateComplaintStatus = (complaintId, body) =>
  request(`/support/complaints/${id(complaintId)}/status`, { method: 'PUT', body });
export const getSupportComplaintMessages = (complaintId) =>
  request(`/support/complaints/${id(complaintId)}/messages`);
export const sendSupportComplaintMessage = (complaintId, content) =>
  request(`/support/complaints/${id(complaintId)}/messages`, { method: 'POST', body: { content } });
export const addSupportInternalNote = (complaintId, content) =>
  request(`/support/complaints/${id(complaintId)}/internal-notes`, { method: 'POST', body: { content } });
export const createSupportEscalation = (complaintId, body) =>
  request(`/support/complaints/${id(complaintId)}/escalations`, { method: 'POST', body });
export const getSupportEscalations = (filters) => request(`/support/escalations${query(filters)}`);
export const getSupportEscalationDetail = (escalationId) =>
  request(`/support/escalations/${id(escalationId)}`);
export const getSupportCustomerPoints = (userId) =>
  request(`/support/customers/${id(userId)}/points`);
