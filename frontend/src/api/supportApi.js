import { request } from './httpClient';

const id = encodeURIComponent;
const query = (filters = {}) => {
  const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const suffix = params.toString();
  return suffix ? `?${suffix}` : '';
};

export const getSupportComplaints = (filters) => request(`/support/complaints${query(filters)}`);
export const getSupportComplaint = (complaintId) => request(`/support/complaints/${id(complaintId)}`);
export const getComplaintOrderReference = (complaintId) => request(`/support/complaints/${id(complaintId)}/order-reference`);
export const addComplaintProcessing = (complaintId, body) => request(`/support/complaints/${id(complaintId)}/processings`, { method: 'POST', body });
export const updateComplaintStatus = (complaintId, body) => request(`/support/complaints/${id(complaintId)}/status`, { method: 'PUT', body });
