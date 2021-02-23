// Copyright (C) 2019 ExtraHash
//
// Please see the included LICENSE file for more information.
import fs from 'fs';
import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import jdenticon from 'jdenticon';
import {
  validateAddress,
  validatePaymentID
} from 'kryptokrona-wallet-backend-js/dist/lib/ValidateParameters';
import NavBar from './NavBar';
import BalanceTop from './BalanceTop'
import BottomBar from './BottomBar';
import Redirector from './Redirector';
import { uiType } from '../utils/utils';
import { addressList, directories, loginCounter, config } from '../index';
import routes from '../constants/routes';
var Identicon = require('identicon.js');
const intToRGB = require('int-to-rgb');


String.prototype.hashCode = function() {
    var hash = 0;
    if (this.length == 0) {
        return hash;
    }
    for (var i = 0; i < this.length; i++) {
        var char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
}

const hashCode = (str) => {
		let hash = Math.abs(str.hashCode())*0.007812499538;
    return Math.floor(hash);

}


function get_avatar(hash) {
  // Displays a fixed identicon until user adds new contact address in the input field
  if (hash.length < 15) {
    hash = 'SEKReYanL2qEQF2HA8tu9wTpKBqoCA8TNb2mNRL5ZDyeFpxsoGNgBto3s3KJtt5PPrRH36tF7DBEJdjUn5v8eaESN2T5DPgRLVY';
  }
  // Get custom color scheme based on address
  let rgb = intToRGB(hashCode(hash));

  // Options for avatar
  var options = {
        foreground: [rgb.red, rgb.green, rgb.blue, 255],               // rgba black
        background: [parseInt(rgb.red/10), parseInt(rgb.green/10), parseInt(rgb.blue/10), 0],         // rgba white
        margin: 0.2,                              // 20% margin
        size: 80,                                // 420px square
        format: 'svg'                           // use SVG instead of PNG
      };

  // create a base64 encoded SVG
  return 'data:image/svg+xml;base64,' + new Identicon(hash, options).toString();

}


type State = {
  darkMode: boolean,
  showNewContactForm: boolean,
  newName: string,
  newAddress: string,
  newPaymentID: string,
  addressBook: any[],
  deletionRequests: number[],
  badAddress: boolean,
  badPaymentID: boolean,
  pageAnimationIn: string
};

type Props = {};

class AddressBook extends Component<Props, State> {
  props: Props;

  state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      darkMode: config.darkMode,
      showNewContactForm: false,
      newName: '',
      newAddress: '',
      newPaymentID: '',
      addressBook: addressList,
      deletionRequests: [],
      badAddress: false,
      badPaymentID: false,
      pageAnimationIn: loginCounter.getAnimation('/addressbook')
    };
    this.showAddContactForm = this.showAddContactForm.bind(this);
    this.handleNewAddressChange = this.handleNewAddressChange.bind(this);
    this.handleNewNameChange = this.handleNewNameChange.bind(this);
    this.handleNewPaymentIDChange = this.handleNewPaymentIDChange.bind(this);
    this.addNewContact = this.addNewContact.bind(this);
    this.deleteContact = this.deleteContact.bind(this);
    this.cancelAddContact = this.cancelAddContact.bind(this);
  }

  componentWillMount() {}

  componentWillUnmount() {}

  showAddContactForm = () => {
    this.setState({
      showNewContactForm: true
    });
  };

  handleNewNameChange = (event: any) => {
    const newName = event.target.value;
    this.setState({
      newName
    });
  };

  handleNewAddressChange = (event: any) => {
    const newAddress = event.target.value;
    const regex = /^[a-z0-9]*$/i;
    if (!regex.test(newAddress)) {
      return;
    }
    this.setState({
      newAddress
    });
  };

  handleNewPaymentIDChange = (event: any) => {
    const newPaymentID = event.target.value;
    this.setState({
      newPaymentID
    });
  };

  deleteContact = (index: number) => {
    let { deletionRequests } = this.state;
    const { addressBook } = this.state;
    const [programDirectory] = directories;

    if (deletionRequests.includes(index)) {
      addressBook.splice(index, 1);
      deletionRequests = [];
      fs.writeFileSync(
        `${programDirectory}/addressBook.json`,
        JSON.stringify(addressBook, null, 4)
      );
    } else {
      deletionRequests.push(index);
    }

    this.setState({
      addressBook,
      deletionRequests
    });
  };

  search(searchedValue: any, arrayToSearch: any[], objectPropertyName: string) {
    for (let i = 0; i < arrayToSearch.length; i++) {
      if (arrayToSearch[i][objectPropertyName] === searchedValue) {
        return arrayToSearch[i];
      }
    }
  }

  cancelAddContact = () => {
    this.setState({
      showNewContactForm: false,
      newAddress: '',
      newPaymentID: '',
      newName: '',
      badAddress: false,
      badPaymentID: false
    });
  };

  addNewContact = () => {
    const { newName, newAddress, newPaymentID, addressBook } = this.state;
    const [programDirectory] = directories;
    const newContact = {
      name: newName,
      address: newAddress,
      paymentID: newPaymentID
    };

    let badAddress = false;
    let badPaymentID = false;

    if (!validateAddress(newAddress, true)) {
      badAddress = true;
    } else {
      badAddress = false;
    }

    const { errorCode } = validatePaymentID(newPaymentID);

    if (errorCode === 23) {
      badPaymentID = true;
    } else if (errorCode === 0) {
      badPaymentID = false;
    }

    const duplicate = this.search(newAddress, addressBook, 'address');

    if (duplicate) {
      badAddress = true;
    }

    this.setState({
      badAddress,
      badPaymentID
    });

    if (badAddress || badPaymentID || duplicate) {
      return;
    }

    addressBook.push(newContact);

    addressBook.sort((a, b) =>
      a.name.toUpperCase() > b.name.toUpperCase() ? 1 : -1
    );

    fs.writeFileSync(
      `${programDirectory}/addressBook.json`,
      JSON.stringify(addressBook, null, 4)
    );

    this.setState({
      addressBook,
      newAddress: '',
      newPaymentID: '',
      newName: '',
      showNewContactForm: false
    });
  };

  render() {
    const {
      darkMode,
      showNewContactForm,
      newName,
      newAddress,
      newPaymentID,
      addressBook,
      deletionRequests,
      badPaymentID,
      badAddress,
      pageAnimationIn
    } = this.state;

    const { backgroundColor, tableMode, textColor, fillColor } = uiType(
      darkMode
    );
    const displayWelcomeMessage =
      addressBook.length === 0 && !showNewContactForm;

    return (
      <div>
        <Redirector />
        <div className={`wholescreen ${backgroundColor} hide-scrollbar`}>
          <BalanceTop darkMode={darkMode} />
          <NavBar darkMode={darkMode} />
          <div
            className={`maincontent-homescreen ${backgroundColor} ${pageAnimationIn}`}
          >
            {showNewContactForm && (
              <table
                className={`table add-contacts-table is-fullwidth is-family-monospace ${tableMode}`}
              >
                <tbody>
                  <tr className='no-hover'>
                    <td>
                      <img className='avatar-new-contact' src={get_avatar(newAddress, 114)}>
                      </img>
                    </td>
                    </tr>
                    <tr className='no-hover'>
                    <td>
                      <label>Name</label>
                      <input
                        className="input is-large"
                        value={newName}
                        onChange={this.handleNewNameChange}
                      />
                    </td>
                    </tr>
                    <tr className='no-hover'>
                    <td>
                      <label>Address</label>
                      <input
                        className={`input is-large ${
                          badAddress ? 'is-link' : ''
                        }`}
                        value={newAddress}
                        onChange={this.handleNewAddressChange}
                      />
                    </td>
                    </tr>
                    <tr className='no-hover'>
                    <td>
                      <label>Payment ID (optional)</label>
                      <input
                        className={`input is-large ${
                          badPaymentID ? 'is-link' : ''
                        }`}
                        value={newPaymentID}
                        onChange={this.handleNewPaymentIDChange}
                      />
                    </td>
                    </tr>
                    <tr className='no-hover'>
                    <td>
                      <a
                        className={textColor}
                        onClick={this.addNewContact}
                        onKeyPress={this.addNewContact}
                        role="button"
                        tabIndex={0}
                        onMouseDown={event => event.preventDefault()}
                      >
                        <i
                          className="fas fa-save is-size-2 has-text-centered"
                          aria-hidden="true"
                        />
                      </a>
                      <a
                        className={textColor}
                        onClick={this.cancelAddContact}
                        onKeyPress={this.cancelAddContact}
                        role="button"
                        tabIndex={0}
                        onMouseDown={event => event.preventDefault()}
                      >
                        &nbsp;&nbsp;
                        <i
                          className="fas fa-times is-size-2 has-text-centered has-text-link"
                          aria-hidden="true"
                        />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
            <table
              className={`table is-hoverable is-fullwidth is-family-monospace ${tableMode}`}
            >
              <thead>
                <tr>

                  <th className="has-text-centered">
                    <a
                      className={textColor}
                      onClick={this.showAddContactForm}
                      onKeyPress={this.showAddContactForm}
                      role="button"
                      tabIndex={0}
                      onMouseDown={event => event.preventDefault()}
                    >
                      <i className="fas fa-user-plus" />
                    </a>
                  </th>
                </tr>
              </thead>
              <tbody>
                {addressBook.map((contact, index) => {
                  const { name, address, paymentID } = contact;
                  return (
                    <tr key={address}>
                      <td>
                        <img
                        className="contact-avatar"
                        src={get_avatar(address, 60)}>
                        </img>
                        <br />
                        <span
                          className={`contact-name ${textColor} is-family-monospace`}
                          >
                          {name}
                        </span>
                      </td>
                      <td>

                        <textarea
                          className={`contact-address textarea transparent-textarea ${textColor} no-resize is-family-monospace`}
                          defaultValue={address}
                          readOnly
                        />
                      </td>


                      <td className="contacts-td">
                        <div className="contactButtons">
                          <Link
                            className={textColor}
                            to={`${routes.SEND}/${address}/${paymentID}`}
                          >
                            <i
                              className="fa fa-paper-plane is-size-5 has-text-centered"
                              aria-hidden="true"
                            />
                          </Link>
                          <br />
                          <a
                            className={
                              deletionRequests.includes(index)
                                ? 'has-text-link'
                                : textColor
                            }
                          >
                            <i
                              className="fa fa-trash is-size-5 has-text-centered"
                              aria-hidden="true"
                              onClick={() => this.deleteContact(index)}
                            />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {displayWelcomeMessage && (
              <div className="elem-to-center">
                <div className={`box ${fillColor}`}>
                  <p className={`${textColor} title has-text-centered`}>
                    &nbsp;&nbsp;Welcome to your Address Book!
                  </p>
                  <br />
                  <p className={`${textColor} subtitle has-text-centered`}>
                    You don&apos;t have any contacts saved yet. They will
                    display here once you do.
                  </p>
                </div>
              </div>
            )}
          </div>
          <BottomBar darkMode={darkMode} />
        </div>
      </div>
    );
  }
}

export default withRouter(AddressBook);
