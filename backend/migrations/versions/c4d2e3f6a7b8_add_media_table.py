"""Add media table for images stored in the database

Revision ID: c4d2e3f6a7b8
Revises: b3c1d2e4f5a6
Create Date: 2026-10-30 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4d2e3f6a7b8'
down_revision = 'b3c1d2e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'media',
        sa.Column('id', sa.String(length=32), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('content_type', sa.String(length=100), nullable=False),
        sa.Column('size', sa.Integer(), nullable=False),
        sa.Column('data', sa.LargeBinary(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    op.drop_table('media')
