import axios from 'axios';
import env from '../config/env';

const api = axios.create({
    baseURL: env.API_URL,
    timeout: 10000,
});

export const getSitesByCompanyId = async (companyId) => {
    try {
        const response = await api.get(`/get-site-by-company-id/${companyId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching sites:', error);
        throw error;
    }
};

export const login = async (login, password) => {
    try {
        const response = await api.post('/login', {
            login,
            password,
        });
        return response.data;
    } catch (error) {
        if (error.response?.data) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};

export const getMonitoringData = async (startDate, endDate, token, parameter = null) => {
    try {
        const params = { start_date: startDate, end_date: endDate, token };
        if (parameter) {
            params.parameter = parameter;
        }

        const response = await api.get('/monitoring-data', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching monitoring data:', error);
        if (error.response?.data) {
            throw new Error(error.response.data.message);
        }
        throw error;
    }
};


export default api; 