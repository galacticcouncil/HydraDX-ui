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
import { useLocation } from "react-use"
import { Interpolation, Theme } from "@emotion/react"
import { Web3Connect } from "sections/web3-connect/Web3Connect"
import { ReferralsConnect } from "sections/referrals/ReferralsConnect"
import { useRpcProvider } from "providers/rpcProvider"
import { MigrationWarning } from "sections/migration/components/MigrationWarning"
import {
  MIGRATION_TARGET_DOMAIN,
  MIGRATION_TRIGGER_DOMAIN,
  useMigrationStore,
} from "sections/migration/MigrationProvider.utils"
import { useExternalTokensRugCheck } from "api/externalAssetRegistry"

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
  const { migrationCompleted, setMigrationCompleted } = useMigrationStore()

  useExternalTokensRugCheck()

  useEffect(() => {
    ref.current?.scrollTo({
      top: 0,
      left: 0,
    })
  }, [location.pathname])

  const shouldShowMigrationWarning =
    isLoaded && MIGRATION_TARGET_DOMAIN === location.host && !migrationCompleted

  return (
    <>
      {shouldShowMigrationWarning && (
        <MigrationWarning
          onClick={() =>
            (window.location.href = `https://${MIGRATION_TRIGGER_DOMAIN}?from=${MIGRATION_TARGET_DOMAIN}`)
          }
          onClose={() => {
            setMigrationCompleted(new Date().toISOString())
          }}
        />
      )}
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
          </SPageContent>
          <MobileNavBar />
        </div>
      </SPage>
      <Web3Connect />
      {featureFlags.referrals && <ReferralsConnect />}
    </>
  )
}
