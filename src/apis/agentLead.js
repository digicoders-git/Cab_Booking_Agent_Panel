import { agentApi } from "../api/agentApi";

export const createAgentLead = async (data) => {
    const response = await agentApi.post("/api/agent-leads/create", data);
    return response.data;
};

export const getMyAgentLeads = async () => {
    const response = await agentApi.get("/api/agent-leads/agent/my-leads");
    return response.data;
};

export const cancelAgentLead = async (leadId) => {
    const response = await agentApi.post(`/api/agent-leads/${leadId}/cancel`);
    return response.data;
};

export const downloadAgentLeadReceipt = async (leadId) => {
    const response = await agentApi.get(`/api/agent-leads/receipt/${leadId}`, {
        responseType: 'blob'
    });
    return response.data;
};
