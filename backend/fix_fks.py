import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from django.db import connection

with connection.cursor() as cursor:
    # Find all foreign keys referencing 'users' table
    cursor.execute('''
        SELECT
            tc.table_name, 
            kcu.column_name,
            tc.constraint_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND kcu.table_name != 'users'
          AND EXISTS (
              SELECT 1 FROM information_schema.constraint_column_usage ccu
              WHERE ccu.constraint_name = tc.constraint_name
              AND ccu.table_name = 'users'
          )
    ''')
    fks = cursor.fetchall()
    print("Found Foreign Keys referencing 'users':", fks)
    for table_name, column_name, constraint_name in fks:
        print(f"Altering {table_name}.{constraint_name}...")
        cursor.execute(f"ALTER TABLE {table_name} DROP CONSTRAINT {constraint_name}")
        cursor.execute(f"ALTER TABLE {table_name} ADD CONSTRAINT {constraint_name} FOREIGN KEY ({column_name}) REFERENCES users(id) ON DELETE CASCADE")
    print("Done!")
