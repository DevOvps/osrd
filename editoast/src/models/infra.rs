use crate::error::ApiError;
use crate::schema::osrd_infra_infra;
use crate::schema::osrd_infra_infra::dsl::*;
use diesel::result::Error as DieselError;
use diesel::sql_types::Text;
use diesel::ExpressionMethods;
use diesel::{delete, sql_query, update, PgConnection, QueryDsl, RunQueryDsl};
use rocket::http::Status;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use thiserror::Error;

static RAILJSON_VERSION: &str = "2.2.3";

#[derive(Clone, QueryableByName, Queryable, Debug, Serialize, Deserialize)]
#[table_name = "osrd_infra_infra"]
pub struct Infra {
    pub id: i32,
    pub name: String,
    pub version: String,
    pub generated_version: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CreateInfra {
    pub name: String,
}

#[derive(Debug, Error)]
pub enum InfraError {
    /// Couldn't found the infra with the given id
    #[error("Infra '{0}', could not be found")]
    NotFound(i32),
    #[error("An internal diesel error occurred: '{}'", .0.to_string())]
    DieselError(DieselError),
}

impl ApiError for InfraError {
    fn get_status(&self) -> Status {
        match self {
            InfraError::NotFound(_) => Status::NotFound,
            InfraError::DieselError(_) => Status::InternalServerError,
        }
    }

    fn get_type(&self) -> &'static str {
        match self {
            InfraError::NotFound(_) => "editoast:infra:NotFound",
            InfraError::DieselError(_) => "editoast:infra:DieselError",
        }
    }

    fn extra(&self) -> Option<Map<String, Value>> {
        match self {
            InfraError::NotFound(infra_id) => json!({
                "infra_id": infra_id,
            })
            .as_object()
            .cloned(),
            _ => None,
        }
    }
}

impl Infra {
    pub fn retrieve(conn: &PgConnection, infra_id: i32) -> Result<Infra, Box<dyn ApiError>> {
        match osrd_infra_infra.find(infra_id).first(conn) {
            Ok(infra) => Ok(infra),
            Err(DieselError::NotFound) => Err(Box::new(InfraError::NotFound(infra_id))),
            Err(e) => Err(Box::new(InfraError::DieselError(e))),
        }
    }

    pub fn retrieve_for_update(
        conn: &PgConnection,
        infra_id: i32,
    ) -> Result<Infra, Box<dyn ApiError>> {
        match osrd_infra_infra.for_update().find(infra_id).first(conn) {
            Ok(infra) => Ok(infra),
            Err(DieselError::NotFound) => Err(Box::new(InfraError::NotFound(infra_id))),
            Err(e) => Err(Box::new(InfraError::DieselError(e))),
        }
    }

    pub fn list(conn: &PgConnection) -> Vec<Infra> {
        osrd_infra_infra
            .load::<Self>(conn)
            .expect("List infra query failed")
    }

    pub fn list_for_update(conn: &PgConnection) -> Vec<Infra> {
        osrd_infra_infra
            .for_update()
            .load::<Self>(conn)
            .expect("List infra query failed")
    }

    pub fn bump_version(&self, conn: &PgConnection) -> Result<Self, Box<dyn ApiError>> {
        let new_version = self
            .version
            .parse::<u32>()
            .expect("Cannot convert version into an Integer")
            + 1;

        match update(osrd_infra_infra.filter(id.eq(self.id)))
            .set(version.eq(new_version.to_string()))
            .get_result::<Infra>(conn)
        {
            Ok(infra) => Ok(infra),
            Err(DieselError::NotFound) => Err(Box::new(InfraError::NotFound(self.id))),
            Err(err) => Err(Box::new(InfraError::DieselError(err))),
        }
    }

    pub fn bump_generated_version(&self, conn: &PgConnection) -> Result<Self, Box<dyn ApiError>> {
        match update(osrd_infra_infra.filter(id.eq(self.id)))
            .set(generated_version.eq(&self.version))
            .get_result::<Infra>(conn)
        {
            Ok(infra) => Ok(infra),
            Err(DieselError::NotFound) => Err(Box::new(InfraError::NotFound(self.id))),
            Err(err) => Err(Box::new(InfraError::DieselError(err))),
        }
    }

    pub fn create(infra_name: &String, conn: &PgConnection) -> Result<Infra, Box<dyn ApiError>> {
        match sql_query(
            "INSERT INTO osrd_infra_infra (name, railjson_version, owner, version, generated_version)
             VALUES ($1, $2, '00000000-0000-0000-0000-000000000000', '0', '0')
             RETURNING *",
        )
        .bind::<Text, _>(infra_name)
        .bind::<Text, _>(RAILJSON_VERSION)
        .get_result::<Infra>(conn)
        {
            Ok(infra) => Ok(infra),
            Err(err) => Err(Box::new(InfraError::DieselError(err))),
        }
    }

    pub fn delete(infra_id: i32, conn: &PgConnection) -> Result<(), Box<dyn ApiError>> {
        match delete(osrd_infra_infra.filter(id.eq(infra_id))).execute(conn) {
            Ok(1) => Ok(()),
            Ok(_) => Err(Box::new(InfraError::NotFound(infra_id))),
            Err(err) => Err(Box::new(InfraError::DieselError(err))),
        }
    }
}

#[cfg(test)]
pub mod test {
    use super::Infra;
    use crate::client::PostgresConfig;
    use diesel::result::Error;
    use diesel::{Connection, PgConnection};
    use rocket::http::Status;

    pub fn test_transaction(fn_test: fn(&PgConnection, Infra)) {
        let conn = PgConnection::establish(&PostgresConfig::default().url()).unwrap();
        conn.test_transaction::<_, Error, _>(|| {
            let infra = Infra::create(&"test".to_string(), &conn).unwrap();

            fn_test(&conn, infra);
            Ok(())
        });
    }

    #[test]
    fn create_infra() {
        test_transaction(|_, infra| {
            assert_eq!("test", infra.name);
        });
    }

    #[test]
    fn delete_infra() {
        test_transaction(|conn, infra| {
            assert!(Infra::delete(infra.id, conn).is_ok());
            let err = Infra::delete(infra.id, conn).unwrap_err();
            assert_eq!(err.get_status(), Status::NotFound);
        });
    }
}
