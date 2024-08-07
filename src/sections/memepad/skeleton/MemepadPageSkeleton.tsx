import { MemepadLayout } from "sections/memepad/components/MemepadLayout"
import { MemepadSpinner } from "sections/memepad/components/MemepadSpinner"

export const MemepadPageSkeleton = () => {
  return (
    <MemepadLayout>
      <MemepadSpinner />
    </MemepadLayout>
  )
}
