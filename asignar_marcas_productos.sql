-- Actualizar productos con sus marcas correspondientes

-- Producto "deportivo" -> GRASEP
UPDATE zapatos 
SET marca = 'GRASEP'
WHERE nombre = 'deportivo';

-- Producto "gracep new" -> GRASEP
UPDATE zapatos 
SET marca = 'GRASEP'
WHERE nombre = 'gracep new';

-- Verificar que se actualizó
SELECT id, nombre, marca, categoria
FROM zapatos
WHERE disponible = true
ORDER BY nombre;
