# frozen_string_literal: true

class DropInviteInvalidatedAt < ActiveRecord::Migration[6.0]
  DROPPED_COLUMNS ||= {
    invites: %i{invalidated_at}
  }

  def up
    DROPPED_COLUMNS.each do |table, columns|
      Migration::ColumnDropper.execute_drop(table, columns)
    end
  end

  def down
    add_column :invites, :invalidated_at, :datetime
  end
end
