import { Header } from "components/Layout/Header/Header"
import { ReactNode, useEffect, useRef } from "react"
import { MobileNavBar } from "components/Layout/Header/MobileNavBar/MobileNavBar"
import {
  SGradientBg,
  SPage,
  SPageContent,
  SPageGrid,
  SPageInner,
  SSubHeader,
} from "./Page.styled"
import { ProviderSelectButton } from "sections/provider/components/ProviderSelectButton/ProviderSelectButton"
import { useLocation } from "react-use"
import { ToastSidebar } from "components/Toast/sidebar/ToastSidebar"

type Props = {
  variant?: "stats" | "default"
  className?: string
  children: ReactNode
  subHeader?: ReactNode
}

export const Page = ({
  variant = "default",
  className,
  children,
  subHeader,
}: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    ref.current?.scrollTo({
      top: 0,
      left: 0,
    })
  }, [location.pathname])

  return (
    <>
      <SPage ref={ref}>
        <div>
          {variant === "stats" && <SPageGrid />}
          <Header />
          <SPageContent>
            {subHeader && (
              <SSubHeader>
                <div>{subHeader}</div>
              </SSubHeader>
            )}
            <SGradientBg variant={variant} />
            <SPageInner className={className}>{children}</SPageInner>
            <ProviderSelectButton />
          </SPageContent>
          <MobileNavBar />
        </div>
      </SPage>
      <ToastSidebar />
    </>
  )
}
