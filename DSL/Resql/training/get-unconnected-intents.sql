SELECT DISTINCT intent
FROM intent
WHERE intent NOT IN
    (SELECT DISTINCT intent
     FROM service_trigger)
  OR intent IN
    (SELECT DISTINCT intent
     FROM service_trigger
     WHERE status IN ('declined','deleted'))
  AND intent NOT IN
    (SELECT DISTINCT intent
     FROM service_trigger
     WHERE status IN ('pending'))
ORDER BY intent ASC
