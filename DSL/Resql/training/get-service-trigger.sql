SELECT id, intent, service, status, author_role, created
FROM service_trigger
WHERE service = :serviceId
  AND id = (
    SELECT MAX(id)
    FROM service_trigger
    WHERE service = :serviceId
  )
  AND status NOT IN ('deleted', 'declined');
