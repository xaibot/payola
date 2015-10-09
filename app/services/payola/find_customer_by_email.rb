module Payola
  class FindCustomerByEmail

    def self.call(email)
      Stripe.api_key = Payola.secret_key
      customers = Stripe::Customer.all.data.select{|k| k.email == email }
      raise 'more than one customer with the same email address' if customers.size > 1
      customers.first if customers.size == 1
      nil
    end

  end
end