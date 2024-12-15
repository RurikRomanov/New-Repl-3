import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const verifyUser = (initData: string) => 
  api.post('/auth/verify', { initData });

export const getCurrentBlock = () =>
  api.get('/blocks/current');

export const submitSolution = (blockId: number, nonce: string, minerId: string) =>
  api.post('/blocks/solution', { blockId, nonce, minerId });

export const getLeaderboard = () =>
  api.get('/stats/leaderboard');

export const getUserStats = (userId: string) =>
  api.get(`/stats/user/${userId}`);
