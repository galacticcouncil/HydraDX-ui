import { useEffect, useState } from "react"
import { useRootStore } from "sections/lending/store/root"
import { selectSuccessfulTransactions } from "sections/lending/store/transactionsSelectors"

export const TransactionEventHandler = () => {
  const [postedTransactions, setPostedTransactions] = useState<{
    [chainId: string]: string[]
  }>({})

  const successfulTransactions = useRootStore(selectSuccessfulTransactions)

  //tx's currently tracked: supply, borrow, withdraw, repay, repay with coll, collateral switch

  useEffect(() => {
    Object.keys(successfulTransactions).forEach((chainId) => {
      const chainIdNumber = +chainId
      Object.keys(successfulTransactions[chainIdNumber]).forEach((txHash) => {
        if (!postedTransactions[chainIdNumber]?.includes(txHash)) {
          // update local state
          if (postedTransactions[chainIdNumber]) {
            setPostedTransactions((prev) => ({
              ...prev,
              [chainIdNumber]: [...prev[chainIdNumber], txHash],
            }))
          } else {
            setPostedTransactions((prev) => ({
              ...prev,
              [+chainId]: [txHash],
            }))
          }
        }
      })
    })
  }, [postedTransactions, successfulTransactions])

  return null
}
