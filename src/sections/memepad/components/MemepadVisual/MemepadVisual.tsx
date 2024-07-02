import React, { useEffect, useRef } from "react"
import { SBottleCaps, SContainer } from "./MemepadVisual.styled"
import {
  useAnimation,
  useReducedMotion,
  m as motion,
  LazyMotion,
  domAnimation,
} from "framer-motion"
import { useMedia } from "react-use"
import { theme } from "theme"

import bottlecap1 from "assets/images/bottlecap1.png"
import bottlecap2 from "assets/images/bottlecap2.png"
import bottlecap3 from "assets/images/bottlecap3.png"

export type MemepadVisualProps = {
  className?: string
}

export const MemepadVisual: React.FC<MemepadVisualProps> = ({ className }) => {
  const animationRef = useRef<number>()
  const shouldReduceMotion = useReducedMotion()
  const isDesktop = useMedia(theme.viewport.gte.md)

  const animation1 = useAnimation()
  const animation2 = useAnimation()
  const animation3 = useAnimation()

  const shouldAnimate = isDesktop && !shouldReduceMotion

  useEffect(() => {
    const update = (e: MouseEvent) => {
      const clientX = e.x
      const clientY = e.y

      const moveX = clientX - window.innerWidth / 2
      const moveY = clientY - window.innerHeight / 2
      const offseFactor1 = 100
      const offseFactor2 = 200
      const offseFactor3 = 400

      animationRef.current = window.requestAnimationFrame(() => {
        animation1.start({
          x: (moveX / offseFactor1) * -1,
          y: (moveY / offseFactor1) * -1,
        })
        animation2.start({
          x: (moveX / offseFactor2) * -1,
          y: (moveY / offseFactor2) * -1,
        })
        animation3.start({
          x: (moveX / offseFactor3) * -1,
          y: (moveY / offseFactor3) * -1,
        })
      })
    }

    if (shouldAnimate) {
      window.addEventListener("mousemove", update)
      return () => {
        window.removeEventListener("mousemove", update)
        animationRef.current &&
          window.cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animation1, animation2, animation3, shouldAnimate])

  return (
    <LazyMotion features={domAnimation}>
      <SContainer className={className} as={motion.div}>
        {isDesktop ? (
          <>
            <motion.div animate={animation3}>
              <img src={bottlecap3} alt="" width={150} height={150} />
            </motion.div>
            <motion.div animate={animation2}>
              <img src={bottlecap2} alt="" width={175} height={175} />
            </motion.div>
            <motion.div animate={animation1}>
              <img src={bottlecap1} alt="" width={250} height={250} />
            </motion.div>
          </>
        ) : (
          <SBottleCaps />
        )}
      </SContainer>
    </LazyMotion>
  )
}
