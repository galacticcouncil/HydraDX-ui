import { CheckIcon } from "@heroicons/react/outline"
import { CogIcon } from "@heroicons/react/solid"

import {
  Box,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  SvgIcon,
  Typography,
} from "@mui/material"
import * as React from "react"
import { ApprovalMethod } from "sections/lending/store/walletSlice"

interface ApprovalMethodToggleButtonProps {
  currentMethod: ApprovalMethod
  setMethod: (newMethod: ApprovalMethod) => void
}

export const ApprovalMethodToggleButton = ({
  currentMethod,
  setMethod,
}: ApprovalMethodToggleButtonProps) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    setAnchorEl(event.currentTarget)
  }
  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <>
      <Box
        onClick={handleClick}
        sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
        data-cy={`approveButtonChange`}
      >
        <Typography variant="subheader2" color="info.main">
          <span>{currentMethod}</span>
        </Typography>
        <SvgIcon sx={{ fontSize: 16, ml: 4, color: "white" }}>
          <CogIcon />
        </SvgIcon>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "basic-button",
        }}
        keepMounted={true}
        data-cy={`approveMenu_${currentMethod}`}
      >
        <MenuItem
          data-cy={`approveOption_${ApprovalMethod.PERMIT}`}
          selected={currentMethod === ApprovalMethod.PERMIT}
          value={ApprovalMethod.PERMIT}
          onClick={() => {
            if (currentMethod === ApprovalMethod.APPROVE) {
              setMethod(ApprovalMethod.PERMIT)
            }
            handleClose()
          }}
        >
          <ListItemText primaryTypographyProps={{ variant: "subheader1" }}>
            <span>{ApprovalMethod.PERMIT}</span>
          </ListItemText>
          <ListItemIcon>
            <SvgIcon>
              {currentMethod === ApprovalMethod.PERMIT && <CheckIcon />}
            </SvgIcon>
          </ListItemIcon>
        </MenuItem>

        <MenuItem
          data-cy={`approveOption_${ApprovalMethod.APPROVE}`}
          selected={currentMethod === ApprovalMethod.APPROVE}
          value={ApprovalMethod.APPROVE}
          onClick={() => {
            if (currentMethod === ApprovalMethod.PERMIT) {
              setMethod(ApprovalMethod.APPROVE)
            }
            handleClose()
          }}
        >
          <ListItemText primaryTypographyProps={{ variant: "subheader1" }}>
            <span>{ApprovalMethod.APPROVE}</span>
          </ListItemText>
          <ListItemIcon>
            <SvgIcon>
              {currentMethod === ApprovalMethod.APPROVE && <CheckIcon />}
            </SvgIcon>
          </ListItemIcon>
        </MenuItem>
      </Menu>
    </>
  )
}
