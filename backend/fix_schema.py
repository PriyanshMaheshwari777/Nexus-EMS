from database import engine
from sqlalchemy import text

def fix_schema():
    print("Fixing database schema...")
    with engine.connect() as conn:
        conn = conn.execution_options(isolation_level="AUTOCOMMIT")
        
        try:
            print("Dropping tables with schema issues to force clean recreate...")
            conn.execute(text("DROP TABLE IF EXISTS nexus_notifications;"))
            conn.execute(text("DROP TABLE IF EXISTS nexus_tasks;"))
            print("Dropped nexus_notifications and nexus_tasks. Restarting the backend will recreate them.")
        except Exception as e:
            print(f"Error dropping table: {e}")

if __name__ == "__main__":
    fix_schema()
