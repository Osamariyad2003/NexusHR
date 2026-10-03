import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

/**
 * Loads a backend resource (routes/resources.routes.js) and exposes create/update/remove that save
 * to the server, refresh the list and show the server's message. Errors are shown as toasts and
 * re-thrown so forms can keep their input.
 *   const { rows, loading, error, create, update, remove, reload } = useResource('offices');
 * Settings-style resources: const { data, save } = useResource('notificationPreferences', { settings: true });
 */
export function useResource(name, { settings = false, quiet = false } = {}) {
  const { showToast } = useApp();
  const [rows, setRows] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setError('');
    try {
      const result = await api.listResource(name);
      if (settings) setData(result);
      else setRows(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [name, settings]);

  useEffect(() => { reload(); }, [reload]);

  const run = useCallback(async (call, successMessage) => {
    try {
      const res = await call();
      if (!quiet) showToast(successMessage || res.message, 'success');
      await reload();
      return res.data;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  }, [reload, showToast, quiet]);

  return {
    rows,
    data,
    loading,
    error,
    reload,
    create: (fields, message) => run(() => api.createResource(name, fields), message),
    update: (id, fields, message) => run(() => api.updateResource(name, id, fields), message),
    remove: (id, message) => run(() => api.deleteResource(name, id), message),
    save: (fields, message) => run(() => api.saveResourceSettings(name, fields), message)
  };
}
