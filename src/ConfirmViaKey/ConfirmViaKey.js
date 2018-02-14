// Copyright 2015-2017 Parity Technologies (UK) Ltd.
// This file is part of Parity.

// Parity is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// Parity is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with Parity.  If not, see <http://www.gnu.org/licenses/>.

import React, { Component } from 'react';
import Button from 'semantic-ui-react/dist/commonjs/elements/Button';
import Form from 'semantic-ui-react/dist/commonjs/collections/Form';
import IdentityIcon from '@parity/ui/lib/IdentityIcon';
import { FormattedMessage } from 'react-intl';
import Input from '@parity/ui/lib/Form/Input';
import { observer } from 'mobx-react';
import pick from 'lodash/pick';
import PropTypes from 'prop-types';

import styles from './ConfirmViaKey.css';

@observer
class ConfirmViaKey extends Component {
  static contextTypes = {
    api: PropTypes.object.isRequired
  };

  static propTypes = {
    address: PropTypes.string.isRequired,
    isDisabled: PropTypes.bool,
    isFocused: PropTypes.bool,
    request: PropTypes.object.isRequired,
    transaction: PropTypes.object
  };

  state = {
    isSending: false,
    password: '',
    passwordError: null,
    wallet: null,
    walletError: null
  };

  handleChange = ({ target: { value } }) =>
    this.setState({
      password: value,
      passwordError: null
    });

  handleConfirm = () => {
    const { api } = this.context;
    const { request, transaction } = this.props;
    const { password } = this.state;

    this.setState({ isSending: true });

    // Note that transaction can be null, in this case confirmRequest will
    // sign the message that was initially in the request
    return api.signer
      .confirmRequest(request.id, pick(transaction, ['condition', 'gas', 'gasPrice,']), password)
      .then(() => this.setState({ isSending: false }))
      .catch(error => this.setState({ isSending: false, passwordError: error.text }));
  };

  handleKeySelect = event => {
    // Check that file have been selected
    if (event.target.files.length === 0) {
      return this.setState({
        wallet: null,
        walletError: null
      });
    }

    const fileReader = new FileReader();

    fileReader.onload = e => {
      try {
        const wallet = JSON.parse(e.target.result);

        try {
          if (wallet && typeof wallet.meta === 'string') {
            wallet.meta = JSON.parse(wallet.meta);
          }
        } catch (e) {}

        this.setState({
          wallet,
          walletError: null
        });
      } catch (error) {
        this.setState({
          wallet: null,
          walletError: (
            <FormattedMessage
              id='signer.txPendingConfirm.errors.invalidWallet'
              defaultMessage='Given wallet file is invalid.'
            />
          )
        });
      }
    };

    fileReader.readAsText(event.target.files[0]);
  };

  render () {
    const { address, isDisabled } = this.props;

    const { isSending, wallet, walletError } = this.state;
    const isWalletOk = walletError === null && wallet !== null;

    return (
      <div className={ styles.confirmForm }>
        <Form>
          {this.renderKeyInput()}
          {this.renderPassword()}
          {this.renderHint()}
          {this.renderError()}
          <Button
            className={ styles.confirmButton }
            content={
              isSending ? (
                <FormattedMessage id='signer.txPendingConfirm.buttons.confirmBusy' defaultMessage='Confirming...' />
              ) : (
                <FormattedMessage
                  id='signer.txPendingConfirm.buttons.confirmRequest'
                  defaultMessage='Confirm Request'
                />
              )
            }
            disabled={ isDisabled || isSending || !isWalletOk }
            fluid
            icon={ <IdentityIcon address={ address } button className={ styles.signerIcon } /> }
            onClick={ this.handleConfirm }
          />
        </Form>
      </div>
    );
  }

  renderPassword () {
    const { password, passwordError, wallet } = this.state;

    if (!wallet) {
      return null;
    }

    return (
      <Input
        error={ passwordError }
        hint={ <FormattedMessage id='signer.txPendingConfirm.password.decrypt.hint' defaultMessage='decrypt the key' /> }
        label={ <FormattedMessage id='signer.txPendingConfirm.password.decrypt.label' defaultMessage='Key Password' /> }
        onChange={ this.handleChange }
        type='password'
        value={ password }
      />
    );
  }

  renderError () {
    const { passwordError, walletError } = this.state;

    return (
      <div className={ styles.error }>
        {walletError}
        {passwordError}
      </div>
    );
  }

  renderHint () {
    const { wallet } = this.state;

    const passwordHint = (wallet && wallet.meta && wallet.meta.passwordHint) || null;

    if (!passwordHint) {
      return null;
    }

    return (
      <div className={ styles.passwordHint }>
        <FormattedMessage
          id='signer.txPendingConfirm.passwordHint'
          defaultMessage='(hint) {passwordHint}'
          values={ {
            passwordHint
          } }
        />
      </div>
    );
  }

  renderKeyInput () {
    const { isFocused } = this.props;
    const { walletError } = this.state;

    return (
      <Input
        className={ styles.fileInput }
        error={ walletError }
        focused={ isFocused }
        hint={
          <FormattedMessage
            id='signer.txPendingConfirm.selectKey.hint'
            defaultMessage='The keyfile to use for this account'
          />
        }
        label={ <FormattedMessage id='signer.txPendingConfirm.selectKey.label' defaultMessage='Select Local Key' /> }
        onChange={ this.handleKeySelect }
        type='file'
      />
    );
  }
}

export default ConfirmViaKey;
