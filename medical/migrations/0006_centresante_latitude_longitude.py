# Generated migration for adding latitude and longitude to CentreSante

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('medical', '0005_consultation_is_verrouille_consultation_rdv_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='centresante',
            name='latitude',
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='centresante',
            name='longitude',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
