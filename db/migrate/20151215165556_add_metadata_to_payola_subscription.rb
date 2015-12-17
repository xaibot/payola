class AddMetadataToPayolaSubscription < ActiveRecord::Migration
  def change
    add_column :payola_subscriptions, :metadata, :string
  end
end
