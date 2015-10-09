module Payola
  class FindCustomer

    def self.call(stripe_customer_id)
      secret_key = Payola.secret_key
      customer = Stripe::Customer.retrieve(stripe_customer_id, secret_key)
    end

  end
end