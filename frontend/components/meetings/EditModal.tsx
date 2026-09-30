import Modal from '@/components/ui/Modal'
import ScheduleForm from '@/components/meetings/ScheduleForm'
import type { Meeting } from '@/types'

interface Props {
  meeting: Meeting
  onClose: () => void
  onSaved: () => void
}

export default function EditModal({ meeting: m, onClose, onSaved }: Props) {
  return (
    <Modal title="Edit Meeting" onClose={onClose}>
      <ScheduleForm
        initial={{
          id: m.id,
          title: m.title,
          description: m.description ?? '',
          duration_minutes: m.duration_minutes,
        }}
        onSaved={onSaved}
        onCancel={onClose}
      />
    </Modal>
  )
}
