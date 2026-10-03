import { useCallback } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';

/** Candidates plus the pipeline stages, with stage moves and other candidate actions saved on the server. */
export function useCandidates() {
  const { showToast } = useApp();
  const candidates = useResource('candidates');
  const settings = useResource('recruitmentSettings', { settings: true });

  const act = useCallback(async (candidate, action, body) => {
    try {
      const res = await api.resourceAction('candidates', candidate.id, action, body);
      showToast(res.message, action === 'email' ? 'info' : 'success');
      await candidates.reload();
      return res.data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [candidates, showToast]);

  return {
    ...candidates,
    stages: settings.data?.stages || [],
    settings: settings.data,
    act,
    move: (candidate, stage) => act(candidate, 'move', { stage }).catch(() => {})
  };
}
