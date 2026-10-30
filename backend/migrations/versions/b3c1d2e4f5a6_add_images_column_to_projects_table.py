"""Add images column to projects table

Revision ID: b3c1d2e4f5a6
Revises: 45709ca1a055
Create Date: 2026-10-29 23:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'b3c1d2e4f5a6'
down_revision = '45709ca1a055'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.add_column(sa.Column('images', sa.Text(), nullable=True))


def downgrade():
    with op.batch_alter_table('projects', schema=None) as batch_op:
        batch_op.drop_column('images')
