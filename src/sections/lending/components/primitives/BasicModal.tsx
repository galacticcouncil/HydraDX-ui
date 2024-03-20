import { Modal } from "components/Modal/Modal"
import React from "react"

export interface BasicModalProps {
  open: boolean
  children: React.ReactNode
  setOpen: (value: boolean) => void
}

export const BasicModal = ({ open, setOpen, children }: BasicModalProps) => {
  const handleClose = () => setOpen(false)

  return (
    <Modal open={open} onClose={handleClose}>
      {children}
    </Modal>
  )
}
