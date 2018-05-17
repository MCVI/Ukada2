# url format: <mysql/postgres[ext]/sqlite[ext]>[+pool]://username:password@ip:port/database_name
#database_url="mysql+pool://mcvioj:debug@127.0.0.1:3306/mcvioj";
DATABASE_URL="sqlite:///debug.db"

#!! Echance the Secret Key before Applying to Production Environment!
SECRET_KEY="MCVIOJ_DEBUG"

#!! Attention: This visible to All Clients
MCVI_PASSWD_PREFIX_PUBLIC="MCVI-PRE-PUBLIC"

MCVI_PASSWD_PREFIX_SERVER="MCVI-PRE-SERVER"
