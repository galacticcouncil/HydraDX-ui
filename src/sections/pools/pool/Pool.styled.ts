import styled from "@emotion/styled"
import { m as motion } from "framer-motion"
import { theme } from "theme"

export const SPoolContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  width: calc(100% + 24px);

  overflow: hidden;

  margin: 0 -12px;
  margin-top: -22px;

  position: relative;
  height: 100%;

  @media ${theme.viewport.gte.sm} {
    margin: 0 auto;

    width: 730px;
    height: auto;

    border-radius: ${theme.borderRadius.medium}px;
  }
`

export const SStablepoolBadge = styled(motion.div)`
  border-radius: 35px;
  background: ${theme.gradients.pinkLightBlue};

  height: 14px;

  display: flex;
  align-items: center;

  font-size: 10px;
  color: ${theme.colors.basic900};
  text-transform: uppercase;
  font-weight: 700;
  font-family: GeistMedium;
  line-height: normal;

  cursor: pointer;

  &:after {
    content: "s";
    padding: 0 4px;
  }

  &:hover {
    &:after {
      content: "stablepool";
      padding: 0 4px;
    }
  }
`
