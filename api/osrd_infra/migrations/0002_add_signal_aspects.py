# Generated by Django 3.1.6 on 2022-01-25 14:17

from django.db import migrations, models
import osrd_infra.utils


class Migration(migrations.Migration):

    dependencies = [
        ('osrd_infra', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='signalmodel',
            name='data',
            field=models.JSONField(validators=[osrd_infra.utils.JSONSchemaValidator(limit_value={'definitions': {'Direction': {'description': 'An enumeration.', 'enum': ['START_TO_STOP', 'STOP_TO_START'], 'title': 'Direction', 'type': 'string'}, 'ObjectReference': {'properties': {'id': {'maxLength': 255, 'title': 'Id', 'type': 'string'}, 'type': {'title': 'Type', 'type': 'string'}}, 'required': ['id', 'type'], 'title': 'ObjectReference', 'type': 'object'}, 'Point': {'description': 'Point Model', 'properties': {'coordinates': {'anyOf': [{'items': [{'anyOf': [{'type': 'number'}, {'type': 'integer'}]}, {'anyOf': [{'type': 'number'}, {'type': 'integer'}]}], 'maxItems': 2, 'minItems': 2, 'type': 'array'}, {'items': [{'anyOf': [{'type': 'number'}, {'type': 'integer'}]}, {'anyOf': [{'type': 'number'}, {'type': 'integer'}]}, {'anyOf': [{'type': 'number'}, {'type': 'integer'}]}], 'maxItems': 3, 'minItems': 3, 'type': 'array'}], 'title': 'Coordinates'}, 'type': {'const': 'Point', 'title': 'Type', 'type': 'string'}}, 'required': ['coordinates'], 'title': 'Point', 'type': 'object'}}, 'properties': {'angle': {'title': 'Angle', 'type': 'number'}, 'aspects': {'items': {'type': 'string'}, 'title': 'Aspects', 'type': 'array'}, 'direction': {'$ref': '#/definitions/Direction'}, 'expr': {'title': 'Expr'}, 'geo': {'$ref': '#/definitions/Point'}, 'id': {'maxLength': 255, 'title': 'Id', 'type': 'string'}, 'linked_detector': {'$ref': '#/definitions/ObjectReference'}, 'position': {'title': 'Position', 'type': 'number'}, 'sch': {'$ref': '#/definitions/Point'}, 'sight_distance': {'title': 'Sight Distance', 'type': 'number'}, 'track': {'$ref': '#/definitions/ObjectReference'}}, 'required': ['geo', 'sch', 'track', 'position', 'id', 'direction', 'sight_distance', 'angle'], 'title': 'Signal', 'type': 'object'})]),
        ),
    ]
