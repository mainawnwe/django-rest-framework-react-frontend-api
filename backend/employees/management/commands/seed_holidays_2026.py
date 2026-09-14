from datetime import date
from django.core.management.base import BaseCommand
from employees.models import Holiday


HOLIDAYS_2026 = {
    'HK': [
        (date(2026, 1, 1), "New Year's Day"),
        (date(2026, 2, 17), "Lunar New Year"),
        (date(2026, 2, 18), "Lunar New Year (Day 2)"),
        (date(2026, 2, 19), "Lunar New Year (Day 3)"),
        (date(2026, 4, 3), "Good Friday"),
        (date(2026, 4, 4), "Ching Ming Festival"),
        (date(2026, 4, 6), "Easter Monday"),
        (date(2026, 5, 1), "Labour Day"),
        (date(2026, 5, 25), "Buddha's Birthday"),
        (date(2026, 6, 19), "Tuen Ng Festival"),
        (date(2026, 7, 1), "HKSAR Establishment Day"),
        (date(2026, 10, 1), "National Day"),
        (date(2026, 10, 6), "Mid-Autumn Festival"),
        (date(2026, 10, 26), "Chung Yeung Festival"),
        (date(2026, 12, 25), "Christmas Day"),
        (date(2026, 12, 26), "Boxing Day"),
    ],
    'CN': [
        (date(2026, 1, 1), "New Year's Day"),
        (date(2026, 2, 17), "Spring Festival"),
        (date(2026, 2, 18), "Spring Festival"),
        (date(2026, 2, 19), "Spring Festival"),
        (date(2026, 4, 4), "Qingming Festival"),
        (date(2026, 5, 1), "Labour Day"),
        (date(2026, 5, 2), "Labour Day (Day 2)"),
        (date(2026, 5, 3), "Labour Day (Day 3)"),
        (date(2026, 6, 25), "Dragon Boat Festival"),
        (date(2026, 9, 25), "Mid-Autumn Festival"),
        (date(2026, 10, 1), "National Day"),
        (date(2026, 10, 2), "National Day (Day 2)"),
        (date(2026, 10, 3), "National Day (Day 3)"),
    ],
    'MO': [
        (date(2026, 1, 1), "New Year's Day"),
        (date(2026, 2, 17), "Lunar New Year"),
        (date(2026, 2, 18), "Lunar New Year (Day 2)"),
        (date(2026, 2, 19), "Lunar New Year (Day 3)"),
        (date(2026, 4, 3), "Good Friday"),
        (date(2026, 4, 4), "Ching Ming Festival"),
        (date(2026, 5, 1), "Labour Day"),
        (date(2026, 6, 19), "Tuen Ng Festival"),
        (date(2026, 9, 25), "Mid-Autumn Festival"),
        (date(2026, 10, 1), "National Day"),
        (date(2026, 10, 6), "Chung Yeung Festival"),
        (date(2026, 12, 8), "Immaculate Conception"),
        (date(2026, 12, 20), "Macau S.A.R. Establishment Day"),
        (date(2026, 12, 25), "Christmas Day"),
    ],
    'TW': [
        (date(2026, 1, 1), "New Year's Day"),
        (date(2026, 2, 17), "Spring Festival"),
        (date(2026, 2, 18), "Spring Festival"),
        (date(2026, 2, 19), "Spring Festival"),
        (date(2026, 4, 4), "Children's Day"),
        (date(2026, 4, 5), "Tomb Sweeping Day"),
        (date(2026, 5, 1), "Labour Day"),
        (date(2026, 6, 25), "Dragon Boat Festival"),
        (date(2026, 9, 25), "Mid-Autumn Festival"),
        (date(2026, 10, 10), "National Day"),
    ],
}


class Command(BaseCommand):
    help = 'Seed public holidays for 2026 (HK, CN, MO, TW)'

    def add_arguments(self, parser):
        parser.add_argument('--region', type=str)

    def handle(self, *args, **options):
        regions = [options['region']] if options['region'] else HOLIDAYS_2026.keys()
        total_created = 0
        total_skipped = 0

        for region in regions:
            if region not in HOLIDAYS_2026:
                self.stdout.write(self.style.WARNING(f'Unknown region: {region}'))
                continue
            for holiday_date, name in HOLIDAYS_2026[region]:
                obj, created = Holiday.objects.get_or_create(
                    date=holiday_date,
                    region=region,
                    defaults={'name': name},
                )
                if created:
                    total_created += 1
                else:
                    total_skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f'Created {total_created} holidays, skipped {total_skipped} existing.'
        ))