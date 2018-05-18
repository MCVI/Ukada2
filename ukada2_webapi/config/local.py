# This file is to store configuration containing sensitive information

# url format: <mysql/postgres[ext]/sqlite[ext]>[+pool]://username:password@ip:port/database_name
# database_url="mysql+pool://mcvioj:debug@127.0.0.1:3306/mcvioj"
DATABASE_URL="sqlite:///debug.db"

#!! Echance the Secret Key before Applying to Production Environment!
SECRET_KEY="MCVIOJ_DEBUG"

MCVI_PASSWD_PREFIX_SERVER="MCVI-PRE-SERVER"

#!! Attention: This visible to ALL clients
MCVI_PASSWD_PREFIX_PUBLIC="MCVI-PRE-PUBLIC"
