import { IUser } from "@rocket.chat/core-typings";
import {
  Field,
  FieldGroup,
  TextInput,
  TextAreaInput,
  Box,
  Icon,
  AnimatedVisibility,
  PasswordInput,
  Button,
  Grid,
  Margins,
} from "@rocket.chat/fuselage";
import { useDebouncedCallback, useSafely } from "@rocket.chat/fuselage-hooks";
import {
  useToastMessageDispatch,
  useMethod,
  useTranslation,
  TranslationKey,
} from "@rocket.chat/ui-contexts";
import React, {
  Dispatch,
  ReactElement,
  SetStateAction,
  useCallback,
  useMemo,
  useEffect,
  useState,
} from "react";

import { validateEmail } from "../../../../lib/emailValidator";
import { getUserEmailAddress } from "../../../../lib/getUserEmailAddress";
import CustomFieldsForm from "../../../components/CustomFieldsForm";
import UserStatusMenu from "../../../components/UserStatusMenu";
import UserAvatarEditor from "../../../components/avatar/UserAvatarEditor";
import {
  USER_STATUS_TEXT_MAX_LENGTH,
  BIO_TEXT_MAX_LENGTH,
} from "../../../lib/constants";
import { AccountFormValues } from "./AccountProfilePage";

type AccountProfileFormProps = {
  values: Record<string, unknown>;
  handlers: Record<string, (eventOrValue: unknown) => void>;
  user: IUser | null;
  settings: Record<string, unknown> & { namesRegex: RegExp };
  onSaveStateChange: Dispatch<SetStateAction<boolean>>;
};

// TODO: Replace this form using React Hook Form
const AccountProfileForm = ({
  values,
  handlers,
  user,
  settings,
  onSaveStateChange,
  ...props
}: AccountProfileFormProps): ReactElement => {
  const t = useTranslation();
  const dispatchToastMessage = useToastMessageDispatch();

  const checkUsernameAvailability = useMethod("checkUsernameAvailability");
  const getAvatarSuggestions = useMethod("getAvatarSuggestion");
  const sendConfirmationEmail = useMethod("sendConfirmationEmail");

  const [usernameError, setUsernameError] = useState<string | undefined>();
  const [avatarSuggestions, setAvatarSuggestions] = useSafely(useState());

  const {
    allowRealNameChange,
    allowUserStatusMessageChange,
    allowEmailChange,
    allowPasswordChange,
    allowUserAvatarChange,
    canChangeUsername,
    namesRegex,
    requireName,
  } = settings;

  const {
    realname,
    email,
    username,
    password,
    confirmationPassword,
    statusText,
    bio,
    statusType,
    customFields,
    nickname,
  } = values as AccountFormValues;

  // const objBio = JSON.parse(bio);

  const {
    handleRealname,
    handleEmail,
    handleUsername,
    handlePassword,
    handleConfirmationPassword,
    handleAvatar,
    handleStatusText,
    handleStatusType,
    handleBio,
    handleCustomFields,
    handleNickname,
  } = handlers;

  const previousEmail = user ? getUserEmailAddress(user) : "";

  const handleSendConfirmationEmail = useCallback(async () => {
    if (email !== previousEmail) {
      return;
    }
    try {
      await sendConfirmationEmail(email);
      dispatchToastMessage({
        type: "success",
        message: t("Verification_email_sent"),
      });
    } catch (error: unknown) {
      dispatchToastMessage({ type: "error", message: error });
    }
  }, [dispatchToastMessage, email, previousEmail, sendConfirmationEmail, t]);

  const passwordError = useMemo(
    () =>
      !password || !confirmationPassword || password === confirmationPassword
        ? undefined
        : t("Passwords_do_not_match"),
    [t, password, confirmationPassword]
  );
  const emailError = useMemo(
    () => (validateEmail(email) ? undefined : "error-invalid-email-address"),
    [email]
  );
  const checkUsername = useDebouncedCallback(
    async (username: string) => {
      if (user?.username === username) {
        return setUsernameError(undefined);
      }
      if (!namesRegex.test(username)) {
        return setUsernameError(t("error-invalid-username"));
      }
      const isAvailable = await checkUsernameAvailability(username);
      if (!isAvailable) {
        return setUsernameError(t("Username_already_exist"));
      }
      setUsernameError(undefined);
    },
    400,
    [namesRegex, t, user?.username, checkUsernameAvailability, setUsernameError]
  );

  useEffect(() => {
    const getSuggestions = async (): Promise<void> => {
      const suggestions = await getAvatarSuggestions();
      setAvatarSuggestions(suggestions);
    };
    getSuggestions();
  }, [getAvatarSuggestions, setAvatarSuggestions]);

  useEffect(() => {
    checkUsername(username);
  }, [checkUsername, username]);

  useEffect(() => {
    if (!password) {
      handleConfirmationPassword("");
    }
  }, [password, handleConfirmationPassword]);

  const nameError = useMemo(() => {
    if (user?.name === realname) {
      return undefined;
    }
    if (!realname && requireName) {
      return t("Field_required");
    }
  }, [realname, requireName, t, user?.name]);

  const statusTextError = useMemo(() => {
    if (statusText && statusText.length > USER_STATUS_TEXT_MAX_LENGTH) {
      return t("Max_length_is", USER_STATUS_TEXT_MAX_LENGTH);
    }

    return undefined;
  }, [statusText, t]);

  const bioError = useMemo(() => {
    if (bio && bio.length > BIO_TEXT_MAX_LENGTH) {
      return t("Max_length_is", BIO_TEXT_MAX_LENGTH);
    }

    return undefined;
  }, [bio, t]);

  const {
    emails: [{ verified = false } = { verified: false }],
  } = user as any;

  // const handleProperties = (e) => {
  //   const tempBio = { ...objBio, [e.target.name]: e.target.value };
  //   const newBio = JSON.stringify(tempBio);
  //   handleBio(newBio);
  // };

  const canSave = !![
    !!passwordError,
    !!emailError,
    !!usernameError,
    !!nameError,
    !!statusTextError,
    !!bioError,
  ].filter(Boolean);

  useEffect(() => {
    onSaveStateChange(canSave);
  }, [canSave, onSaveStateChange]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <FieldGroup is="form" autoComplete="off" onSubmit={handleSubmit} {...props}>
      {useMemo(
        () => (
          <Field>
            <UserAvatarEditor
              etag={user?.avatarETag}
              currentUsername={user?.username}
              username={username}
              setAvatarObj={handleAvatar}
              disabled={!allowUserAvatarChange}
              suggestions={avatarSuggestions}
            />
          </Field>
        ),
        [
          username,
          user?.username,
          handleAvatar,
          allowUserAvatarChange,
          avatarSuggestions,
          user?.avatarETag,
        ]
      )}
      <Box display="flex" flexDirection="row" justifyContent="space-between">
        {useMemo(() => (
          <Field mie="x8" flexShrink={1}>
            <Field.Label flexGrow={0}>{t("Name")}</Field.Label>
            <Field.Row>
              <TextInput
                error={nameError}
                disabled={!allowRealNameChange}
                flexGrow={1}
                value={realname}
                onChange={handleRealname}
              />
            </Field.Row>
            {!allowRealNameChange && (
              <Field.Hint>{t("RealName_Change_Disabled")}</Field.Hint>
            )}
            <Field.Error>{nameError}</Field.Error>
          </Field>
        ))}
        {useMemo(
          () => (
            <Field mis="x8" flexShrink={1}>
              <Field.Label flexGrow={0}>{t("Username")}</Field.Label>
              <Field.Row>
                <TextInput
                  error={usernameError}
                  disabled={!canChangeUsername}
                  flexGrow={1}
                  value={username}
                  onChange={handleUsername}
                  addon={<Icon name="at" size="x20" />}
                />
              </Field.Row>
              {!canChangeUsername && (
                <Field.Hint>{t("Username_Change_Disabled")}</Field.Hint>
              )}
              <Field.Error>{usernameError}</Field.Error>
            </Field>
          ),
          [t, username, handleUsername, canChangeUsername, usernameError]
        )}
      </Box>
      {useMemo(
        () => (
          <Field>
            <Field.Label>{t("StatusMessage")}</Field.Label>
            <Field.Row>
              <TextInput
                error={statusTextError}
                disabled={!allowUserStatusMessageChange}
                flexGrow={1}
                value={statusText}
                onChange={handleStatusText}
                placeholder={t("StatusMessage_Placeholder")}
                addon={
                  <UserStatusMenu
                    margin="neg-x2"
                    onChange={handleStatusType}
                    initialStatus={statusType as IUser["status"]}
                  />
                }
              />
            </Field.Row>
            {!allowUserStatusMessageChange && (
              <Field.Hint>{t("StatusMessage_Change_Disabled")}</Field.Hint>
            )}
            <Field.Error>{statusTextError}</Field.Error>
          </Field>
        ),
        [
          t,
          statusTextError,
          allowUserStatusMessageChange,
          statusText,
          handleStatusText,
          handleStatusType,
          statusType,
        ]
      )}
      {useMemo(
        () => (
          <Field>
            <Field.Label>{t("Nickname")}</Field.Label>
            <Field.Row>
              <TextInput
                flexGrow={1}
                value={nickname}
                onChange={handleNickname}
                addon={<Icon name="edit" size="x20" alignSelf="center" />}
              />
            </Field.Row>
          </Field>
        ),
        [nickname, handleNickname, t]
      )}
      {useMemo(
				() => (
					<Field>
						<Field.Label>{t('Bio')}</Field.Label>
						<Field.Row>
							<TextAreaInput
								error={bioError}
								rows={3}
								flexGrow={1}
								value={bio}
								onChange={handleBio}
								addon={<Icon name='edit' size='x20' alignSelf='center' />}
							/>
						</Field.Row>
						<Field.Error>{bioError}</Field.Error>
					</Field>
				),
				[bio, handleBio, bioError, t],
			)}
      {/*additional properties start 	=marked by angel=*/}
      {/* <Field>
        <Grid>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"Street address"}</Field.Label>
                    <Field.Row>
                      <TextInput
                        name="street"
                        flexGrow={1}
                        value={objBio.street}
                        onChange={handleProperties}
                      />
                    </Field.Row>
                  </Field>
                ),
                [bio, handleProperties, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"city state zip"}</Field.Label>
                    <Field.Row>
                      <TextInput
                        name="state"
                        flexGrow={1}
                        value={objBio.state}
                        onChange={handleProperties}
                      />
                    </Field.Row>
                  </Field>
                ),
                [bio, handleProperties, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
        </Grid>
      </Field>
      <Field>
        <Grid>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"phone number"}</Field.Label>
                    <Field.Row>
                      <TextInput
                        name="phone"
                        flexGrow={1}
                        value={objBio.phone}
                        onChange={handleProperties}
                      />
                    </Field.Row>
                  </Field>
                ),
                [bio, handleBio, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"gender"}</Field.Label>
                    <Field.Row>
                      <select
                        name="gender"
                        value={objBio.gender}
                        onInput={handleProperties}
                        className={"rc-input__element"}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </Field.Row>
                  </Field>
                ),
                [bio, handleBio, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
        </Grid>
      </Field>{" "}
      <Field>
        <Grid>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"Date of Birth"}</Field.Label>
                    <Field.Row>
                      <input
                        name="birth"
                        value={objBio.birth}
                        type="date"
                        onInput={handleProperties}
                        className={"rc-input__element"}
                      />
                    </Field.Row>
                  </Field>
                ),
                [bio, handleBio, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"Area Code"}</Field.Label>
                    <Field.Row>
                      <TextInput
                        name="areaCode"
                        flexGrow={1}
                        value={objBio.areaCode}
                        onChange={handleProperties}
                      />
                    </Field.Row>
                  </Field>
                ),
                [bio, handleBio, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
        </Grid>
      </Field>{" "}
      <Field>
        <Grid>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"Social Security"}</Field.Label>
                    <Field.Row>
                      <TextInput
                        name="socialSecurity"
                        flexGrow={1}
                        value={objBio.socialSecurity}
                        onChange={handleProperties}
                      />
                    </Field.Row>
                  </Field>
                ),
                [bio, handleBio, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
        </Grid>
      </Field>{" "}
      <Field>
        <Grid>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"Medicare #"}</Field.Label>
                    <Field.Row>
                      <select
                        name="Medicare"
                        value={objBio.Medicare}
                        onInput={handleProperties}
                        className={"rc-input__element"}
                      >
                        <option value="True">True</option>
                        <option value="False">False</option>
                      </select>
                    </Field.Row>
                  </Field>
                ),
                [bio, handleBio, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"MIB"}</Field.Label>
                    <Field.Row>
                      <TextInput
                        name="MIB"
                        flexGrow={1}
                        value={objBio.MIB}
                        onChange={handleProperties}
                      />
                    </Field.Row>
                  </Field>
                ),
                [bio, handleBio, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
        </Grid>
      </Field>{" "}
      <Field>
        <Grid>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"Medicare Part A start date"}</Field.Label>
                    <Field.Row>
                      <input
                        name="MPartADate"
                        value={objBio.MPartADate}
                        type="date"
                        onInput={handleProperties}
                        className={"rc-input__element"}
                      />
                    </Field.Row>
                  </Field>
                ),
                [bio, handleBio, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{"Medicare Part B start date"}</Field.Label>
                    <Field.Row>
                      <input
                        name="MPartBDate"
                        value={objBio.MPartBDate}
                        type="date"
                        onInput={handleProperties}
                        className={"rc-input__element"}
                      />
                    </Field.Row>
                  </Field>
                ),
                [bio, handleBio, bioError, t]
              )}
            </FieldGroup>
          </Grid.Item>
        </Grid>
      </Field>{" "}
       */}
      
      {/*additional properties end 	=marked by angel=*/}
      <Field>
        <Grid>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{t("Email")}</Field.Label>
                    <Field.Row>
                      <TextInput
                        flexGrow={1}
                        value={email}
                        error={emailError}
                        onChange={handleEmail}
                        addon={
                          <Icon
                            name={verified ? "circle-check" : "mail"}
                            size="x20"
                          />
                        }
                        disabled={!allowEmailChange}
                      />
                    </Field.Row>
                    {!allowEmailChange && (
                      <Field.Hint>{t("Email_Change_Disabled")}</Field.Hint>
                    )}
                    <Field.Error>{t(emailError as TranslationKey)}</Field.Error>
                  </Field>
                ),
                [t, email, handleEmail, verified, allowEmailChange, emailError]
              )}
              {useMemo(
                () =>
                  !verified && (
                    <Field>
                      <Margins blockEnd="x28">
                        <Button
                          disabled={email !== previousEmail}
                          onClick={handleSendConfirmationEmail}
                        >
                          {t("Resend_verification_email")}
                        </Button>
                      </Margins>
                    </Field>
                  ),
                [verified, t, email, previousEmail, handleSendConfirmationEmail]
              )}
            </FieldGroup>
          </Grid.Item>
          <Grid.Item>
            <FieldGroup
              display="flex"
              flexDirection="column"
              flexGrow={1}
              flexShrink={0}
            >
              {useMemo(
                () => (
                  <Field>
                    <Field.Label>{t("Password")}</Field.Label>
                    <Field.Row>
                      <PasswordInput
                        autoComplete="off"
                        disabled={!allowPasswordChange}
                        error={passwordError}
                        flexGrow={1}
                        value={password}
                        onChange={handlePassword}
                        addon={<Icon name="key" size="x20" />}
                      />
                    </Field.Row>
                    {!allowPasswordChange && (
                      <Field.Hint>{t("Password_Change_Disabled")}</Field.Hint>
                    )}
                  </Field>
                ),
                [
                  t,
                  password,
                  handlePassword,
                  passwordError,
                  allowPasswordChange,
                ]
              )}
              {useMemo(
                () => (
                  <Field>
                    <AnimatedVisibility
                      visibility={
                        password
                          ? AnimatedVisibility.VISIBLE
                          : AnimatedVisibility.HIDDEN
                      }
                    >
                      <Field.Label>{t("Confirm_password")}</Field.Label>
                      <Field.Row>
                        <PasswordInput
                          autoComplete="off"
                          error={passwordError}
                          flexGrow={1}
                          value={confirmationPassword}
                          onChange={handleConfirmationPassword}
                          addon={<Icon name="key" size="x20" />}
                        />
                      </Field.Row>
                      {passwordError && (
                        <Field.Error>{passwordError}</Field.Error>
                      )}
                    </AnimatedVisibility>
                  </Field>
                ),
                [
                  t,
                  confirmationPassword,
                  handleConfirmationPassword,
                  password,
                  passwordError,
                ]
              )}
            </FieldGroup>
          </Grid.Item>
        </Grid>
      </Field>
      <CustomFieldsForm
        customFieldsData={customFields}
        setCustomFieldsData={handleCustomFields}
      />
    </FieldGroup>
  );
};

export default AccountProfileForm;
