from pathlib import Path
from typing import List, Mapping

from django.db import connection, transaction

from osrd_infra.models import Infra
from osrd_infra.schemas.infra import BaseObjectTrait, RailJsonInfra

CURRENT_DIR = Path(__file__).parent
GET_INFRA_SQL = open(CURRENT_DIR / "sql/get_infra.sql").read()


def serialize_infra(infra: Infra):
    with connection.cursor() as cursor:
        cursor.execute(GET_INFRA_SQL, [infra.id])
        res = cursor.fetchone()[0]
    return res


def import_objects(objects: List[BaseObjectTrait], infra: Infra, max_bulk_size=float("inf")):
    """
    Import list of objects converting them to models then using bulk create.
    """
    models = []
    while objects:
        models.append(objects.pop().into_model(infra))
        if len(models) > max_bulk_size:
            model_type = type(models[0])
            model_type.objects.bulk_create(models)
            models = []
    if models:
        model_type = type(models[0])
        model_type.objects.bulk_create(models)


@transaction.atomic
def import_infra(railjson: Mapping, infra_name: str):
    # Parse railjson payload
    railjson: RailJsonInfra = RailJsonInfra.parse_obj(railjson)

    # Create infra
    infra = Infra.objects.create(name=infra_name)

    # Import base objects
    import_objects(railjson.operational_points, infra)
    import_objects(railjson.routes, infra, max_bulk_size=10_000)
    import_objects(railjson.switch_types, infra)
    import_objects(railjson.switches, infra)
    import_objects(railjson.track_sections, infra)
    import_objects(railjson.signals, infra)
    import_objects(railjson.buffer_stops, infra)
    import_objects(railjson.detectors, infra)
    import_objects(railjson.track_section_links, infra)
    import_objects(railjson.speed_sections, infra)
    import_objects(railjson.catenaries, infra)

    return infra
