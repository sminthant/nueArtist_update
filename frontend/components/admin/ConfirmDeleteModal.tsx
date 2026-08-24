'use client';

import DangerButton from '@/components/admin/DangerButton';
import Modal from '@/components/admin/Modal';
import SecondaryButton from '@/components/admin/SecondaryButton';

export default function ConfirmDeleteModal({
  show,
  onClose,
  title = 'Delete item',
  message = 'Are you sure you want to delete this? This action cannot be undone.',
  confirmLabel = 'Delete',
  onConfirm,
  loading = false,
}: {
  show: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
}) {
  return (
    <Modal show={show} onClose={onClose}>
      <div className="p-6">
        <h3 className="font-orbitron text-lg font-semibold text-edm-text">{title}</h3>
        <p className="mt-2 text-sm text-edm-text-secondary">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <SecondaryButton type="button" onClick={onClose}>
            Cancel
          </SecondaryButton>
          <DangerButton type="button" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmLabel}
          </DangerButton>
        </div>
      </div>
    </Modal>
  );
}
