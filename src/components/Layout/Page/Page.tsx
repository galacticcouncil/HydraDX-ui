import { Header } from "components/Layout/Header/Header"
import { ReactNode, useEffect, useRef } from "react"
import { MobileNavBar } from "components/Layout/Header/MobileNavBar/MobileNavBar"
import {
  SGradientBg,
  SPage,
  SPageContent,
  SPageInner,
  SSubHeader,
} from "./Page.styled"
import { ProviderSelectButton } from "sections/provider/components/ProviderSelectButton/ProviderSelectButton"
import { useLocation } from "react-use"
import { Interpolation, Theme } from "@emotion/react"
import { Web3Connect } from "sections/web3-connect/Web3Connect"
import { ReferralsConnect } from "sections/referrals/ReferralsConnect"
import { useRpcProvider } from "providers/rpcProvider"
import { ExternalAssetsRugCheck } from "sections/assets/external/ExternalAssetsRugCheck"

type Props = {
  className?: string
  children: ReactNode
  subHeader?: ReactNode
  subHeaderStyle?: Interpolation<Theme>
}

export const Page = ({
  className,
  children,
  subHeader,
  subHeaderStyle,
}: Props) => {
  const { featureFlags, isLoaded } = useRpcProvider()
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
      {isLoaded && <ExternalAssetsRugCheck />}
      <SPage ref={ref}>
        <div
          sx={{ flex: "column", height: "100%" }}
          css={{ position: "relative" }}
        >
          <SGradientBg />
          <Header />
          <SPageContent>
            {subHeader && (
              <SSubHeader css={subHeaderStyle}>{subHeader}</SSubHeader>
            )}
            <SPageInner className={className}>{children}</SPageInner>
            <ProviderSelectButton />
          </SPageContent>
          <MobileNavBar />
        </div>
      </SPage>
      <Web3Connect />
      {featureFlags.referrals && <ReferralsConnect />}
    </>
  )
}
