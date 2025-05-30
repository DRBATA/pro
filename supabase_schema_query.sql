
-- List all tables and their columns
SELECT 
    t.table_name, 
    c.column_name, 
    c.data_type, 
    c.is_nullable
FROM 
    information_schema.tables t
JOIN 
    information_schema.columns c 
    ON t.table_name = c.table_name
WHERE 
    t.table_schema = 'public'
ORDER BY 
    t.table_name, 
    c.ordinal_position;

-- Count rows in each table
SELECT
    tablename,
    (SELECT count(*) FROM public.\
tablename\) AS count
FROM
    pg_catalog.pg_tables
WHERE
    schemaname = 'public';

