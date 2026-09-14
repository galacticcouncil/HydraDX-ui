SELECT
    event.args ->> 'id' AS schedule_id,
    SUM(
        CAST(event.args ->> 'amountIn' AS numeric)
    ) AS amount_in,
    SUM(
        CAST(event.args ->> 'amountOut' AS numeric)
    ) AS amount_out
FROM event
WHERE
    event.name = 'DCA.TradeExecuted'
    -- containment hits the GIN index on event.args;
    -- `args ->> 'id' IN (...)` is unindexable and scans every DCA event
    AND event.args @> ANY (ARRAY[$scheduleIds]::jsonb[])
GROUP BY
    schedule_id;
