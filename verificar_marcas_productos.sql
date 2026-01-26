-- Verificar productos y sus marcas
SELECT id, nombre, marca, categoria, disponible
FROM zapatos
WHERE disponible = true
ORDER BY marca, nombre;

-- Ver si hay productos con marca GRASEP
SELECT id, nombre, marca
FROM zapatos
WHERE LOWER(marca) LIKE '%gras%'
   OR LOWER(marca) LIKE '%grac%';
