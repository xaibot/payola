var PayolaOnestepSubscriptionForm = {
    timeout_message: "This seems to be taking too long. Please contact support and give them transaction ID: ",
    connection_error: "There was a problem connecting to the server. Please, try again.",
    errorMessages: {
      incorrect_number: "The card number is incorrect.",
      invalid_number: "The card number is not a valid credit card number.",
      invalid_expiry_month: "The card's expiration month is invalid.",
      invalid_expiry_year: "The card's expiration year is invalid.",
      invalid_cvc: "The card's security code is invalid.",
      expired_card: "The card has expired.",
      incorrect_cvc: "The card's security code is incorrect.",
      incorrect_zip: "The card's zip code failed validation.",
      card_declined: "The card was declined.",
      missing: "There is no card on a customer that is being charged.",
      processing_error: "An error occurred while processing the card.",
      rate_limit:  "An error occurred due to requests hitting the API too quickly. Please let us know if you're consistently running into this error."
    },
    onSubscriptionSuccess: null,
    disable_other_interactions: null,
    enable_other_interactions: null,

    initialize: function() {
        this.setupSubmitErrorHandling();
        $(document).on('submit', '.payola-onestep-subscription-form', function() {
            return PayolaOnestepSubscriptionForm.handleSubmit($(this));
        });
    },

    setupSubmitErrorHandling: function() {
        $(':submit').click(function() {
            var error_selector = $('form').data('payola-error-selector');
            if (error_selector) {
                $(error_selector).text('');
                $(error_selector).hide();
            } else {
                $('form').find('.payola-payment-error').text('');
                $('form').find('.payola-payment-error').hide();
            }
        });
    },

    handleSubmit: function(form) {
        this.disable_interactions();

        Stripe.card.createToken(form, function(status, response) {
            PayolaOnestepSubscriptionForm.stripeResponseHandler(form, status, response);
        });
        return false;
    },


    disable_interactions: function() {
        $(':submit').prop('disabled', true);
        $('input[type="text"]').prop('disabled', true);
        $('input[type="text"]').css('cursor', 'not-allowed');
        $('.payola-spinner').show();
        if(PayolaOnestepSubscriptionForm.disable_other_interactions)
            PayolaOnestepSubscriptionForm.disable_other_interactions();
    },

    enable_interactions: function() {
        $(':submit').prop('disabled', false);
        $('input[type="text"]').prop('disabled', false);
        $('input[type="text"]').css('cursor', 'default');
        $('.payola-spinner').hide();
        if(PayolaOnestepSubscriptionForm.enable_other_interactions)
            PayolaOnestepSubscriptionForm.enable_other_interactions();
    },

    stripeResponseHandler: function(form, status, response) {
        if (response.error) {
            PayolaOnestepSubscriptionForm.showError(form, response.error.message, response.error.code);
        } else {
            var email = form.find("[data-payola='email']").val();
            var coupon = form.find("[data-payola='coupon']").val();
            var quantity = form.find("[data-payola='quantity']").val();

            var base_path = form.data('payola-base-path');
            var plan_type = form.data('payola-plan-type');
            var plan_id = form.data('payola-plan-id');

            var action = $(form).attr('action');

            form.append($('<input type="hidden" name="plan_type">').val(plan_type));
            form.append($('<input type="hidden" name="plan_id">').val(plan_id));
            form.append($('<input type="hidden" name="stripeToken">').val(response.id));
            form.append($('<input type="hidden" name="stripeEmail">').val(email));
            form.append($('<input type="hidden" name="coupon">').val(coupon));
            form.append($('<input type="hidden" name="quantity">').val(quantity));
            form.append(PayolaOnestepSubscriptionForm.authenticityTokenInput());
            $.ajax({
                type: "POST",
                url: action,
                data: form.serialize(),
                success: function(data) { PayolaOnestepSubscriptionForm.poll(form, 60, data.guid, base_path); },
                error: function(data) {
                    var error_msg = '';
                    if(data && data.responseJSON && data.responseJSON.error) {
                        error_msg = data.responseJSON.error;
                    } else {
                        error_msg = PayolaOnestepSubscriptionForm.connection_error;
                    }
                    PayolaOnestepSubscriptionForm.showError(form, error_msg);
                }
            });
        }
    },

    poll: function(form, num_retries_left, guid, base_path) {
        if (num_retries_left === 0) {
            PayolaOnestepSubscriptionForm.showError(form, this.timeout_message + guid);
        }
        var handler = function(data) {
            if (data.status === "active") {
                if(PayolaOnestepSubscriptionForm.onSubscriptionSuccess) {
                    PayolaOnestepSubscriptionForm.onSubscriptionSuccess(guid);
                } else {
                    window.location = base_path + '/confirm_subscription/' + guid;
                }
            } else {
                setTimeout(function() { PayolaOnestepSubscriptionForm.poll(form, num_retries_left - 1, guid, base_path); }, 500);
            }
        };
        var errorHandler = function(jqXHR){
          if(jqXHR.responseJSON.status === "errored"){
            PayolaSubscriptionForm.showError(form, jqXHR.responseJSON.error);
          }
        };

        $.ajax({
            type: 'GET',
            dataType: 'json',
            url: base_path + '/subscription_status/' + guid,
            success: handler,
            error: errorHandler
        });
    },

    showError: function(form, message, code) {
        this.enable_interactions();

        if(code) {
            var message = PayolaOnestepSubscriptionForm.errorMessages[code];
        }
        var error_selector = form.data('payola-error-selector');
        if (error_selector) {
            $(error_selector).text(message);
            $(error_selector).show();
        } else {
            form.find('.payola-payment-error').text(message);
            form.find('.payola-payment-error').show();
        }
    },

    authenticityTokenInput: function() {
        return $('<input type="hidden" name="authenticity_token"></input>').val($('meta[name="csrf-token"]').attr("content"));
    }
};

$(function() { PayolaOnestepSubscriptionForm.initialize() } );
