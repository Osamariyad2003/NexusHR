import React, { useState } from 'react';
import { DocumentsFolderListView } from './DocumentsFolderListView';
import { DocumentDetailView } from './DocumentDetailView';
import ShareModal from './ShareModal';
import RecordDrawer from '../common/RecordDrawer';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import { VISIBILITY_OPTIONS } from './shared';

/** Documents: folders (who can see them is set by "Share") and the files stored in them. */
export default function DocumentsManagerView() {
  const { currentUser } = useApp();
  const folders = useResource('documentFolders');
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [sharing, setSharing] = useState(null);
  const canEdit = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);

  const open = folders.rows.find(f => f.id === openId);

  return (
    <div className="w-full">
      {open ? (
        <DocumentDetailView folder={open} canEdit={canEdit} onBack={() => setOpenId(null)} onChanged={folders.reload} onShare={() => setSharing(open)} />
      ) : (
        <DocumentsFolderListView
          folders={folders}
          canEdit={canEdit}
          onSelectFolder={(f) => setOpenId(f.id)}
          onNewFolder={() => setCreating(true)}
          onShare={setSharing}
        />
      )}
      <RecordDrawer isOpen={creating} title="New Folder" submitLabel="Create"
        fields={[
          { name: 'name', label: 'Folder name', required: true },
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'visibility', label: 'Who can see it', type: 'select', required: true, options: VISIBILITY_OPTIONS }
        ]}
        initial={{ visibility: 'ALL' }}
        onClose={() => setCreating(false)}
        onSubmit={(v) => folders.create(v)} />
      <ShareModal isOpen={Boolean(sharing)} folder={sharing} onClose={() => setSharing(null)}
        onSave={(visibility) => folders.update(sharing.id, { visibility }, `"${sharing.name}" is now visible to ${VISIBILITY_OPTIONS.find(o => o.value === visibility).label.toLowerCase()}.`)} />
    </div>
  );
}
